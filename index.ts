import Screen from "./Screen";

function renderCanvas($parent: HTMLElement, w: number, h: number) {
  const $canvas = document.createElement("canvas");
  $canvas.setAttribute("width", `${w}`);
  $canvas.setAttribute("height", `${h}`);
  $parent.appendChild($canvas);
  return $canvas;
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

  let lastRender = 0;

  const loop = ts => {
    const elapsed = ts - lastRender;

    screen.resetBuffer();
    screen.render(() => window.requestAnimationFrame(loop));
    lastRender = ts;
  };

  window.requestAnimationFrame(loop);
}

window.onload = function() {
  main();
};
