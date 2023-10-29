import p5 from "p5"

export default class Button {

  public x: number
  public y: number
  public width: number
  public height: number

  public color: string = "slateblue"
  public pressedColor: string = "mediumslateblue"

  public isPressed: boolean = false;

  public visible: boolean = false;

  constructor(public text: string) {

  }

  public setSize(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y
    this.width = width;
    this.height = height;
  }

  public checkPressed(mouseX: number, mouseY: number) {
    return (this.x < mouseX && mouseX < this.x + this.width && this.y < mouseY && mouseY < this.y + this.height)
  }

  public draw(p5: p5) {
    if (!this.visible) return;
    p5.fill(this.isPressed ? this.pressedColor : this.color)
    p5.rect(this.x, this.y, this.width, this.height, 5);
    p5.fill("lightgray")
    p5.textFont('Verdana', 18);
    p5.textAlign("center", "center")
    p5.text(this.text, this.x, this.y, this.width, this.height)
  }
}