import Screen from "./Screen";
import Memory from "./Memory";
import Keyboard from "./Keyboard";

console.log = () => {};

export default class CPU {
  memory: Memory;
  screen: Screen;
  keyboard: Keyboard;

  // CPU Registers
  // V[0-14] general purpose
  // V[15] carry flag
  private V: Uint8Array = new Uint8Array(16);
  // Stack (not in spec)
  private stack: Uint16Array = new Uint16Array(16);
  // Stack pointer
  private sp: 0x000;
  // Index register 16 bit
  private I: number = 0x000;
  // program counter 16 bit
  private pc: number = 0x200;
  // Delay timer
  private dt: number = 0x000;
  // Sound timer
  private st: number = 0x000;

  private halted: boolean = false;

  constructor(memory: Memory, screen: Screen, keyboard: Keyboard) {
    this.memory = memory;
    this.screen = screen;
    this.keyboard = keyboard;
    this.reset();
  }

  executeCycle() {
    // Don't read out of bounds
    // CPU needs to be reset
    if (this.pc > 4096) {
      return;
    }

    if (this.halted) {
      return;
    }

    const opcode = this.memory.readWord(this.pc);
    this.pc += 2;

    this.processOpcode(opcode);
  }

  halt() {
    this.halted = true;
  }

  private processOpcode(opcode: number) {
    // Preparse common variables
    const nnn = opcode & 0x0fff;
    const kk = opcode & 0x00ff;
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;
    const n = opcode & 0x000f;
    console.log("OPCODE " + this.fmtWord(opcode));
    switch (opcode & 0xf000) {
      case 0x0000:
        // SYS 0nnn | CLS 00E0
        switch (nnn) {
          case 0x00e0:
            console.log("CLS");
            this.screen.resetBuffer();
            return;
          case 0x00ee:
            console.log(`RET ${this.fmtWord(this.stack[this.sp])}`);
            this.pc = this.stack[this.sp--];
            return;
          case 0x0000:
            // NOOP
            return;
          // SYS 0nnn
          default:
            console.log(`SYS ${this.fmtWord(nnn)}`);
            return;
        }
      case 0x1000:
        console.log(`JMP ${this.fmtWord(nnn)}`);
        this.pc = nnn;
        return;
      case 0x2000:
        console.log(`CALL ${this.fmtWord(nnn)}`);
        this.sp++;
        if (this.sp === this.stack.length) {
          this.sp = 0;
        }
        this.stack[this.sp] = this.pc;
        this.pc = nnn;
        return;
      case 0x3000:
        // JMP EQ
        console.log(`JMP IF V[${x}](${this.V[x]}) == ${kk}`);
        if (this.V[x] === kk) {
          this.pc += 2;
        }
        return;
      case 0x4000:
        // JMP NEQ
        console.log(`JMP IF V[${x}](${this.V[x]}) != ${kk}`);
        if (this.V[x] !== kk) {
          this.pc += 2;
        }
        return;
      case 0x5000:
        // JMP EQ Vy
        if (this.V[x] === this.V[y]) {
          this.pc += 2;
        }
        return;
      case 0x6000:
        this.V[x] = kk;
        console.log(`SET V[${x}]=${this.fmtWord(kk)}`);
        return;
      case 0x7000:
        // Add NN to Vx
        const val = (this.V[x] + kk) & 0xff;
        console.log(`SET V[${x}] + ${kk}=${val}`);
        this.V[x] = val;
        console.log(`V[${x}]=${this.V[x]}`);
        return;
      case 0x8000:
        // Math / logic
        switch (opcode & 0x000f) {
          case 0x0000:
            // LD Vx Vy
            this.V[x] = this.V[y];
            return;
          case 0x0001:
            // OR Vx, Vy
            this.V[x] = this.V[x] | this.V[y];
            return;
          case 0x0002:
            // AND Vx Vy
            this.V[x] = this.V[x] & this.V[y];
            return;
          case 0x0003:
            // XOR Vx, Vy
            this.V[x] = this.V[x] ^ this.V[y];
            return;
          case 0x0004:
            // ADD Vx, Vy
            const v2 = this.V[x] + this.V[y];
            // Could this be Vf = v & 0xf00 ?
            if (v2 > 0xff) {
              this.V[0xf] = 0x1;
            } else {
              this.V[0xf] = 0x0;
            }
            this.V[x] = v2 & 0xff;
            return;
          case 0x0005:
            // SUB Vx, Vy
            if (this.V[x] > this.V[y]) {
              this.V[0xf] = 1;
            } else {
              this.V[0xf] = 0;
            }
            const v3 = this.V[x] - this.V[y];
            this.V[x] = v3 & 0xff;
            return;
          case 0x0006:
            // Vx SHR 1
            // Does 1 >> 1 = 0 or 255?
            // Does 0 >> 1 = 0 or 255?
            if ((this.V[x] & 0x1) === 1) {
              this.V[0xf] = 0x1;
            } else {
              this.V[0xf] = 0x0;
            }
            this.V[x] = this.V[x] >> 1;
            return;
          case 0x0007:
            // SUBN Vx Vy
            if (this.V[y] > this.V[x]) {
              this.V[0xf] = 1;
            } else {
              this.V[0xf] = 0;
            }
            this.V[x] = (this.V[y] - this.V[x]) & 0xff;
            return;
          case 0x000e:
            // SHL Vx
            if (this.V[x] >> 7 === 1) {
              this.V[0xf] = 0x1;
            } else {
              this.V[0xf] = 0x0;
            }
            this.V[x] = (this.V[x] << 1) & 0xff;
            return;
          default:
            this.halt();
            return console.warn("UNIMPLEMENTED " + this.fmtWord(opcode));
        }
      case 0x9000:
        // SNE Vx Vy
        if (this.V[x] !== this.V[y]) {
          this.pc += 2;
        }
        return;
      case 0xa000:
        console.log(`MEM ${this.fmtWord(nnn)}`);
        this.I = nnn;
        return;
      case 0xb000:
        // JP V0 addr
        this.pc = nnn + this.V[0];
        return;
      case 0xc000:
        // Set Vx = rand AND kk
        const r = Math.random() * 256;
        this.V[x] = r & kk;
        return;
      case 0xd000:
        // console.info(`Disp x:${x} y:${y} h:${n}`);
        // Draw n-byte sprite starting at memory location I
        // on screen at x,y
        this.drawSprite(this.V[x], this.V[y], n);
        return;
      case 0xe000:
        // Keyboard related instructions
        switch (opcode & 0x00ff) {
          case 0x009e:
            // Skip next if Vx key pressed
            if (this.keyboard.get(this.V[x])) {
              this.pc += 2;
            }
            return;
          case 0x00a1:
            // Skip next if Vx not pressed
            if (!this.keyboard.get(this.V[x])) {
              this.pc += 2;
            }
            return;
          default:
            this.halt();
            console.warn("UNIMPLEMENTED " + this.fmtWord(opcode));
            return;
        }
      case 0xf000:
        // Some function involving Vx
        switch (opcode & 0x00ff) {
          case 0x0007:
            // set vx = dt
            console.log(`SET V${x}=dt${this.dt}`);
            this.V[x] = this.dt;
            return;
          case 0x000a:
            // Wait for keypress and store val in Vx
            for (let i = 0x0; i < 0xf; i++) {
              if (this.keyboard.get(i)) {
                this.V[x] = i;
                return;
              }
            }
            this.pc -= 2;
            return;
          case 0x0015:
            // Set dt = vx
            console.log(`SET DT = V${x}`);
            this.dt = this.V[x];
            return;
          case 0x0018:
            // Set st = vx
            this.st = this.V[x];
            return;
          case 0x001e:
            // Add Vx to I
            console.log(`MEM I+=V[${x}](${this.V[x]})`);
            // VF set to 1 when range overflow, 0 otherwise
            const val = this.I + this.V[x];
            console.log(`SET I=${val & 0xfff}`);
            if (val > 0xfff) {
              this.V[0xf] = 0x1;
            } else {
              this.V[0xf] = 0x0;
            }

            // Overflow around 0xfff
            this.I = val & 0xfff;
            return;

          case 0x0029:
            console.log(`SPRITE_ADDR V[${x}]: ${this.V[x]}`);
            // Set I to the location of sprite for char in Vx
            const char = this.V[x] & 0xf; // 0 - 15
            // I = char * 5
            // 5 bytes per char starting at addres 0x000;
            this.I = char * 5;
            return;
          case 0x0033:
            // BCD(Vx)
            const hundreds = Math.floor(this.V[x] / 100);
            const tens = Math.floor((this.V[x] % 100) / 10);
            const units = this.V[x] % 10;
            this.memory.writeByte(this.I, hundreds);
            this.memory.writeByte(this.I + 1, tens);
            this.memory.writeByte(this.I + 2, units);
            console.log(`BCD(V${x}) = ${hundreds} ${tens} ${units}`);
            return;
          case 0x0055:
            // MEM reg_dump(Vx,&I)
            for (let i = 0; i <= x; i++) {
              this.memory.writeByte(this.I + i, this.V[i]);
              console.log(
                `MEMSET ${this.fmtWord(this.I + i)} = ${this.fmtWord(
                  this.V[i]
                )}`
              );
            }
          case 0x0065:
            // MEM reg_load(Vx,&I)
            for (let i = 0; i <= x; i++) {
              const val = this.memory.readByte(this.I + i);
              console.log(`V[${i}]=${this.fmtWord(val)}`);
              this.V[i] = val;
            }
            return;

          default:
            this.halt();
            console.warn("UNIMPLEMENTED", this.fmtWord(opcode));
            return;
        }
      default:
        this.halt();
        console.warn("UNIMPLEMENTED", this.fmtWord(opcode));
    }
  }

  updateTimers() {
    this.dt--;
    if (this.dt < 0) {
      this.dt = 0;
    }
    this.st--;
    if (this.st < 0) {
      this.st = 0;
    }
  }

  private drawSprite(x: number, y: number, n: number) {
    // Read n bytes starting from address I
    let sprite = [];
    for (let n_i = 0; n_i < n; n_i++) {
      sprite.push(this.memory.readByte(this.I + n_i));
    }

    let collision = false;

    // Each byte decomposed into boolean array
    sprite = sprite.map((row, i) =>
      [0, 1, 2, 3, 4, 5, 6, 7].map(j => {
        const val = !!((1 << (7 - j)) & row);
        const c = this.screen.setXY(x + j, y + i, val);
        collision = c || collision;
        return val;
      })
    );

    this.V[0xf] = collision ? 0x1 : 0x0;

    console.log(`drawSprite ${sprite}`);
  }

  private fmtWord(word: number) {
    const formatted = ("0000" + word.toString(16)).substr(-4).toUpperCase();
    return "0x" + formatted;
  }

  reset() {
    this.V = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.I = 0x000;
    this.pc = 0x200;
    this.sp = 0x000;
    this.dt = 0x000;
    this.st = 0x000;
    this.halted = false;
    console.log("[CPU] Reset");
  }

  drawTest() {
    for (let i = 0; i < 16; i++) {
      this.drawSprite(i * 4, Math.floor(1.5 * i), 5);
      this.I += 5;
    }
    this.I = 0;
  }
}
