interface IOptions {
  pixelWidth: number;
  pixelHeight: number;
  nPixelsX: number;
  nPixelsY: number;
}

const BYTES_PER_PX = 4;

function XOR(a: boolean, b: boolean): boolean {
  return (a || b) && !(a && b);
}

export default class Screen {
  $el: HTMLCanvasElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  targetContext: CanvasRenderingContext2D;
  options: IOptions;
  width: number;
  height: number;
  writeBuffer: number[];
  drawBuffer: number[];
  private drawFlag: boolean = false;

  constructor($el: HTMLCanvasElement, options: IOptions) {
    this.$el = $el;
    this.options = options;
    this.width = options.pixelWidth * options.nPixelsX;
    this.height = options.pixelHeight * options.nPixelsY;

    const N = options.nPixelsX * options.nPixelsY * BYTES_PER_PX;
    this.drawBuffer = new Array(N);
    this.writeBuffer = new Array(options.nPixelsX * options.nPixelsY);

    this.targetContext = $el.getContext("2d");
    this.targetContext.imageSmoothingEnabled = false;
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

  testPattern() {
    this.resetBuffer();
    for (let i = 0; i < this.options.nPixelsX; i++) {
      for (let j = 0; j < this.options.nPixelsY; j++) {
        if (((i + 1) * (j + i)) % 11 === 0) {
          this.setXY(i, j, true);
        }
      }
    }
  }

  getXY(x: number, y: number): boolean {
    const i = this.xyToIndex(x, y);
    return !!this.get(i);
  }

  setXY(x: number, y: number, v: boolean): boolean {
    if (x >= this.options.nPixelsX) {
      // alert(`x:${x}`);
    }
    if (y >= this.options.nPixelsY) {
      // alert(`y:${y}`);
    }
    const i = this.xyToIndex(x, y);
    const vn = v ? 1 : 0;
    const currentValue = this.get(i);
    const newValue = vn ^ currentValue;
    this.set(i, newValue > 0);

    return currentValue && vn && !newValue;
  }

  private xyToIndex(x: number, y: number): number {
    let _x = x;
    let _y = y;
    if (_x >= this.options.nPixelsX) {
      _x -= this.options.nPixelsX;
    }

    if (_y >= this.options.nPixelsY) {
      _y -= this.options.nPixelsY;
    }
    return _x + this.options.nPixelsX * _y;
  }

  get(i: number): number {
    return this.writeBuffer[i];
  }

  set(i: number, v: boolean) {
    if (i > this.options.nPixelsX * this.options.nPixelsY) {
      // alert(i);
    }
    this.drawFlag = true;
    this.writeBuffer[i] = v ? 1 : 0;
    const on = [255, 255, 255, 255];
    const off = [0, 0, 0, 255];
    const vals = v ? on : off;
    const index = i * BYTES_PER_PX;
    for (let j = 0; j < vals.length; j++) {
      this.drawBuffer[index + j] = vals[j];
    }
  }

  render(done: () => any) {
    if (!this.drawFlag) {
      return done();
    }

    const drawBuffer = new Array(
      this.options.nPixelsX * this.options.nPixelsY * BYTES_PER_PX
    );

    this.writeBuffer.forEach((val, i) => {
      const v = val > 0 ? 0xff : 0x00;
      const idx = i * BYTES_PER_PX;

      drawBuffer[idx + 0] = v; // R
      drawBuffer[idx + 1] = v; // G
      drawBuffer[idx + 2] = v; // B
      drawBuffer[idx + 3] = 0xff; // A
    });

    if (drawBuffer.length !== 8192) {
      alert(drawBuffer.length);
    }

    this.drawFlag = false;
    const imageData = new ImageData(
      new Uint8ClampedArray(drawBuffer),
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
    this.targetContext.drawImage(this.canvas, 0, 0, this.width, this.height);
    done();
  }
}
