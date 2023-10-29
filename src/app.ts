import P5 from "p5"

import Board from "./board";

// import "p5/lib/addons/p5.dom";

const sketch = (p5: P5) => {
  const board = new Board(p5);

  p5.setup = (): void => {
    const canvas = p5.createCanvas(window.innerWidth, window.innerHeight);
    p5.noLoop();
    canvas.parent("app");
  };

  p5.windowResized = (): void => {
    board.windowResized();
    p5.resizeCanvas(window.innerWidth, window.innerHeight);
    p5.redraw()
  }

  p5.mouseDragged = () => {
    board.mouseDragged(p5.mouseX, p5.mouseY)
    p5.redraw()
  }

  p5.mouseWheel = (event: WheelEvent) => {
    board.mouseScrolled(event)
    p5.redraw()
  }
  
  p5.mousePressed = () => {
    board.mousePressed(p5.mouseX, p5.mouseY)
    p5.redraw()
  }

  p5.mouseReleased = () => {
    board.mouseReleased(p5.mouseX, p5.mouseY)
    p5.redraw()
  }

  p5.draw = (): void => {
    p5.background(0)
    board.draw();
  };
};

new P5(sketch);
