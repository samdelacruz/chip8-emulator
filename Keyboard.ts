export default class Keyboard {
  keyMap = [];

  constructor() {
    this.reset();
  }

  reset() {
    // Keys 0 to f
    for (let i = 0x0; i < 0xf; i++) {
      this.keyMap[i] = false;
    }
  }

  get(i: number) {
    return !!this.keyMap[i];
  }

  set(i: number, down: boolean) {
    console.info(`[key] ${i} down:${down}`);
    this.keyMap[i] = down;
  }
}
