interface IOptions {
  pixelWidth: number;
  pixelHeight: number;
  nPixelsX: number;
  nPixelsY: number;
}

export default class Screen {
  $el: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  options: IOptions;
  width: number;
  height: number;
  buffer: boolean[];

  constructor($el: HTMLCanvasElement, options: IOptions) {
    this.$el = $el;
    this.options = options;
    this.width = options.pixelWidth * options.nPixelsX;
    this.height = options.pixelHeight * options.nPixelsY;

    const N = this.width * this.height;
    this.buffer = new Array(N);

    this.context = $el.getContext("2d");
  }

  resetBuffer() {
    const N = this.buffer.length;
    for (let i = 0; i < N; i++) {
      this.buffer[i] = Math.floor(10 * Math.random()) % 2 === 0;
    }
  }

  private getXY(i: number) {
    const { nPixelsX: width, nPixelsY: height } = this.options;
    return {
      x: i % width,
      y: Math.floor(i / width)
    };
  }

  private drawPixel(x: number, y: number, value: boolean) {
    const dX = this.options.pixelWidth;
    const dY = this.options.pixelHeight;
    this.context.fillStyle = value ? "#000000" : "#FFFFFF";
    this.context.fillRect(x * dX, y * dY, dX, dY);
  }

  set(i: number, v: boolean) {
    this.buffer[i] = v;
    const { x, y } = this.getXY(i);
    this.drawPixel(x, y, v);
  }

  render() {
    this.buffer.forEach((val, i) => {
      const { x, y } = this.getXY(i);
      this.drawPixel(x, y, val);
    });
  }
}
