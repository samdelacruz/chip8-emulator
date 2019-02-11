import Screen from "./Screen";
import CPU from "./CPU";
import Memory from "./Memory";
import Keyboard from "./Keyboard";

const freq = 500; // 500Hz = 500 s^-1 = 0.5 / ms
const freqMs = 0.5;

function fmtWord(word: number) {
  const formatted = ("0000" + word.toString(16)).substr(-4).toUpperCase();
  return "0x" + formatted;
}

let debugTarget: HTMLElement;
function debugLine(s: string) {
  if (!debugTarget) {
    return;
  }
  debugTarget.textContent += "\n " + s;
}

function renderKeyboard(keyboard: Keyboard): HTMLElement | null {
  const chars = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
  ].map(String);
  let $root = document.getElementById("keyboard");
  if (!$root) {
    return null;
  }

  for (let i = 0; i <= 0xf; i++) {
    const $key = document.createElement("button");
    $key.appendChild(document.createTextNode(chars[i]));
    $key.setAttribute("class", `key-${i}`);
    $key.onmousedown = () => {
      keyboard.set(i, true);
    };
    $key.onmouseup = () => {
      keyboard.set(i, false);
    };

    $root.appendChild($key);
  }

  const keymap = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    q: 4,
    w: 5,
    e: 6,
    a: 7,
    s: 8,
    d: 9,
    h: 0xa,
    j: 0xb,
    k: 0xc,
    b: 0xd,
    n: 0xe,
    m: 0xf
  };

  window.onkeydown = (ev: KeyboardEvent) => {
    const k = keymap[ev.key];
    if (k) {
      keyboard.set(k, true);
    }
  };

  window.onkeyup = (ev: KeyboardEvent) => {
    const k = keymap[ev.key];
    if (k) {
      keyboard.set(k, false);
    }
  };

  return $root;
}

function renderCanvas($parent: HTMLElement, w: number, h: number) {
  const $canvas = document.createElement("canvas");
  $canvas.setAttribute("width", `${w}`);
  $canvas.setAttribute("height", `${h}`);
  $parent.appendChild($canvas);
  return $canvas;
}

function loadProgram(m: Memory, c: CPU, data: ArrayBuffer) {
  debugLine("---LOADING PROGRAM---");
  m.reset();
  const uInt8Array = new Uint8Array(data);
  for (let i = 0; i < data.byteLength; i++) {
    debugLine(`MEM ${fmtWord(i + 0x200)} ${fmtWord(uInt8Array[i])}`);
    m.writeByte(i + 0x200, uInt8Array[i]);
  }
  debugLine("---RESET CPU---");
  c.reset();
}

function main() {
  const $el = document.getElementById("app");
  $el.innerHTML = null;
  const $canvas = renderCanvas($el, 64 * 8, 32 * 8);
  const screen = new Screen($canvas, {
    pixelWidth: 8,
    pixelHeight: 8,
    nPixelsX: 64,
    nPixelsY: 32
  });

  const mem = new Memory();
  const keyboard = new Keyboard();
  const cpu = new CPU(mem, screen, keyboard);

  renderKeyboard(keyboard);

  const input = document.getElementById("file");
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = ee => {
      const contents = ee.target.result;
      screen.resetBuffer();
      loadProgram(mem, cpu, contents);
    };

    reader.readAsArrayBuffer(file);
  };

  let lastRender = 0;
  screen.resetBuffer();
  // screen.testPattern();
  cpu.drawTest();

  const loop = ts => {
    const elapsed = ts - lastRender;
    const cyclesToExecute = Math.floor(elapsed * freqMs);

    for (let i = 0; i < cyclesToExecute; i++) {
      cpu.executeCycle();
    }

    cpu.updateTimers();

    screen.render(() => window.requestAnimationFrame(loop));
    lastRender = ts;
  };

  window.requestAnimationFrame(loop);
}

window.onload = function() {
  debugTarget = document.getElementById("debug");
  main();
};
