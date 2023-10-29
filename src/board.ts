import p5 from "p5";
import Button from "./button";


export interface ZoomConfig {
  MIN_TILE_WIDTH: number;
  MAX_TILE_WIDTH: number;
  ZOOM_STEPS: number;
}

export interface TextColorsConfig {
  [value: number]: string;
  MAX_VALUE: number;
}

type TileDictionary = {
  [key: string]: number | undefined
}

enum GameStates {
  SETUP,
  PLACING,
  RESET,
}

export default class Board {
  ZOOM_SETTINGS: ZoomConfig = {
    MIN_TILE_WIDTH: 35,
    MAX_TILE_WIDTH: 200,
    ZOOM_STEPS: 30,
  }
  TEXTCOLORS_SETTINGS: TextColorsConfig = {
    1: "green",
    2: "orange",
    3: "red",
    4: "blue",
    5: "purple",
    6: "red",
    7: "brown",
    MAX_VALUE: 7
  }

  private gameState: GameStates = GameStates.SETUP
  private currentValue = 1;
  
  readonly LOG_MIN_ZOOM = Math.log(this.ZOOM_SETTINGS.MIN_TILE_WIDTH)
  readonly LOG_MAX_ZOOM = Math.log(this.ZOOM_SETTINGS.MAX_TILE_WIDTH)
  private zoomLevel: number;
  private tileWidth: number;
  private x: number;
  private y: number;
  private xBeforePan: number;
  private yBeforePan: number
  private panning: boolean;
  private panMouseStartX: number | null = null;
  private panMouseStartY: number | null = null;

  private tiles: TileDictionary;
  buttons: Button[];
  resetButton: Button;
  startGameButton: Button;
  isFirstDraw: boolean;

  constructor(private p5: p5) {
    this.setupGame()
  }

  mouseScrolled(event: WheelEvent) {
    if(!this.panning) {
      this.zoomLevel = Math.min(this.ZOOM_SETTINGS.ZOOM_STEPS, Math.max(0, this.zoomLevel-event.deltaY/100));
      this.tileWidth = Math.exp(
        this.LOG_MIN_ZOOM + (this.LOG_MAX_ZOOM - this.LOG_MIN_ZOOM) * (this.zoomLevel/this.ZOOM_SETTINGS.ZOOM_STEPS)
      );
    }
  }

  private legalPlacement(col: number, row: number) {
    // prettier-ignore
    const NEIGHBOURS =
    [[-1, -1], [ 0, -1], [ 1, -1], 
     [-1,  0],           [ 1,  0],
     [-1,  1], [ 0,  1], [ 1,  1]]

    const neighbourSum =  NEIGHBOURS.reduce((sum, pos) => {
      return sum + (this.tiles[`${col+pos[0]} ${row+pos[1]}`] || 0)
    }, 0) 
    return neighbourSum=== this.currentValue
  }

  private setupGame() {
    this.tileWidth = (this.ZOOM_SETTINGS.MAX_TILE_WIDTH + this.ZOOM_SETTINGS.MIN_TILE_WIDTH)/2
    this.zoomLevel = this.ZOOM_SETTINGS.ZOOM_STEPS/2
    this.x = 0
    this.y = 0

    this.isFirstDraw = true

    this.gameState = GameStates.SETUP
    this.currentValue = 1;

    this.resetButton = new Button("Reset Game")
    this.resetButton.color = "slateblue"
    this.resetButton.pressedColor = "mediumslateblue"
    this.resetButton.visible = true;

    this.startGameButton = new Button("Start Game")
    this.startGameButton.color = "lightpink"
    this.startGameButton.pressedColor = "pink"
    this.startGameButton.visible = true
    this.setButtonSizes()

    this.buttons = [
      this.resetButton,
      this.startGameButton
    ]

    this.tiles = {};
  }

  private setButtonSizes() {
    this.resetButton.setSize(15, 15, 150, 40)
    this.startGameButton.setSize(15, this.p5.height*0.92, 150, 40)
  }

  windowResized() {
    this.setButtonSizes()
  }

  mouseReleased(mouseX: number, mouseY: number) {
    if (this.startGameButton.isPressed) {
      this.startGameButton.isPressed = false;
      if (this.startGameButton.checkPressed(mouseX, mouseY)) {
        this.gameState = GameStates.PLACING;
        this.currentValue = 2;
        this.startGameButton.visible = false;
      }
      return
    } else if (this.resetButton.isPressed) {
      this.resetButton.isPressed = false;
      if (this.resetButton.checkPressed(mouseX, mouseY)) {
        this.setupGame()
      }
      return
    }
    if (!this.panning) {
      const colSelected = Math.floor((mouseX-this.x)/this.tileWidth);
      const rowSelected = Math.floor((mouseY-this.y)/this.tileWidth);
      
      if(this.tiles[`${colSelected} ${rowSelected}`]) {
        // Tile Here
        // const tile = this.tiles[`${colSelected} ${rowSelected}`]
      } else {
        // Empty spot
        if(this.gameState === GameStates.PLACING){
          if (this.legalPlacement(colSelected, rowSelected)){
            this.tiles[`${colSelected} ${rowSelected}`] = this.currentValue
            this.currentValue++;
            console.log(this.currentValue)
          }
        }  else if (this.gameState === GameStates.SETUP) {
          this.tiles[`${colSelected} ${rowSelected}`] = this.currentValue
        }
      }
    }
    this.panning = false
  }

  mousePressed(mouseX: number, mouseY: number) {
    this.buttons.forEach((button) => {
      if(button.visible && button.checkPressed(mouseX, mouseY)){
        button.isPressed = true
      }
    })
  }

  mouseDragged(mouseX: number, mouseY: number) {
    if (this.buttons.some((button) => button.isPressed)) {
      return
    }
    if (!this.panning) {
      this.xBeforePan = this.x
      this.yBeforePan = this.y
      this.panMouseStartX = mouseX;
      this.panMouseStartY = mouseY;
      this.panning = true
    } else {
    this.x = this.xBeforePan + (mouseX - this.panMouseStartX!)
    this.y = this.yBeforePan + (mouseY - this.panMouseStartY!)
    }
  }

  draw() {
    if(this.isFirstDraw)this.setButtonSizes();


    //Drawing Board
    this.p5.textFont('Verdana', this.tileWidth*0.8);
    this.p5.textAlign("center", 'center')

    const firstColOffset = (this.x % this.tileWidth) - this.tileWidth
    const firstRowOffset = (this.y % this.tileWidth) - this.tileWidth
    const numCols = (Math.ceil((this.p5.width-firstColOffset) / this.tileWidth)) + 1
    const numRows = (Math.ceil((this.p5.height-firstColOffset) / this.tileWidth)) + 1
    const firstCol = Math.floor((firstColOffset-this.x)/this.tileWidth)
    const firstRow = Math.floor((firstRowOffset-this.y)/this.tileWidth)

    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        const tileVal = this.tiles[`${firstCol+col} ${firstRow+row}`]
        this.p5.fill("white")
        this.p5.square(firstColOffset + this.tileWidth * col, firstRowOffset + this.tileWidth * row, this.tileWidth)
        if (tileVal) {
          if (tileVal === 1) {
            this.p5.fill("darkgray");
            this.p5.circle(firstColOffset + this.tileWidth * (col+0.5), firstRowOffset + this.tileWidth * (row+0.5), this.tileWidth*0.9)
          }
          this.p5.fill(this.TEXTCOLORS_SETTINGS[tileVal % this.TEXTCOLORS_SETTINGS.MAX_VALUE || 1]);
          this.p5.text(tileVal.toString(), firstColOffset + this.tileWidth * (col+0.5), firstRowOffset + this.tileWidth * (row+0.55))
        }
      }
    }

    // Drawing buttons
    this.buttons.forEach((button) => {button.draw(this.p5)})
  }
}