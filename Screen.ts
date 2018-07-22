interface IOptions {
  pixelWidth: number;
  pixelHeight: number;
  nPixelsX: number;
  nPixelsY: number;
}

const BYTES_PER_PX = 4;

export default class Screen {
  $el: HTMLCanvasElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  targetContext: CanvasRenderingContext2D;
  options: IOptions;
  width: number;
  height: number;
  buffer: number[];

  constructor($el: HTMLCanvasElement, options: IOptions) {
    this.$el = $el;
    this.options = options;
    this.width = options.pixelWidth * options.nPixelsX;
    this.height = options.pixelHeight * options.nPixelsY;

    const N = options.nPixelsX * options.nPixelsY * BYTES_PER_PX;
    this.buffer = new Array(N);

    this.targetContext = $el.getContext("2d");
    this.targetContext.imageSmoothingEnabled = false;
    this.targetContext.scale(8, 8);
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.nPixelsX;
    this.canvas.height = options.nPixelsY;
    this.context = this.canvas.getContext("2d");
  }

  resetBuffer() {
    const nPx = this.options.nPixelsX * this.options.nPixelsY;
    for (let i = 0; i < nPx; i++) {
      // const val = Math.floor(Math.random() * 10) % 2 === 0;
      const val = false;
      this.set(i, val);
    }
  }

  set(i: number, v: boolean) {
    const on = [255, 255, 255, 255];
    const off = [0, 0, 0, 255];
    const vals = v ? on : off;
    const index = i * BYTES_PER_PX;
    for (let j = 0; j < vals.length; j++) {
      this.buffer[index + j] = vals[j];
    }
  }

  render(done: () => any) {
    const imageData = new ImageData(
      new Uint8ClampedArray(this.buffer),
      this.options.nPixelsX,
      this.options.nPixelsY
    );
    this.context.putImageData(
      imageData,
      0,
      0,
      0,
      0,
      this.options.nPixelsX,
      this.options.nPixelsY
    );
    const imageSrc = this.canvas.toDataURL();
    const image = new Image();
    image.onload = () => {
      this.targetContext.drawImage(image, 0, 0);
      done();
    };
    image.src = imageSrc;
  }
}
