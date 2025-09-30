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

type TileHashMap<T> = {
  [key: string]: T | undefined
}

enum GameStates {
  SETUP,
  PLACING,
  NO_MOVES
}

// prettier-ignore
const NEIGHBOUR_OFFSETS =
[[-1, -1], [ 0, -1], [ 1, -1], 
 [-1,  0],           [ 1,  0],
 [-1,  1], [ 0,  1], [ 1,  1]]

const MAXIMUM_SCORES = [1,16,28,38,49,60]

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

  private tiles: TileHashMap<number>;
  private allowedMoves: TileHashMap<boolean>
  private moveHistoryQueue: Array<{row: number, col: number, value: number}>;

  buttons: Button[];
  resetButton: Button;
  helpButton: Button;
  startButton: Button;
  undoButton: Button;

  isFirstDraw: boolean;
  onesPlaced: number;

  constructor(private p5: p5) {
    this.setupGame()
  }

  private setupGame() {
    this.tileWidth = (this.ZOOM_SETTINGS.MAX_TILE_WIDTH + this.ZOOM_SETTINGS.MIN_TILE_WIDTH)/2
    this.zoomLevel = this.ZOOM_SETTINGS.ZOOM_STEPS/2
    this.x = 0
    this.y = 0

    this.isFirstDraw = true
    this.onesPlaced = 0

    this.gameState = GameStates.SETUP
    this.currentValue = 1;

    this.resetButton = new Button("Reset Game")
    this.resetButton.color = "slateblue"
    this.resetButton.pressedColor = "mediumslateblue"
    this.resetButton.visible = true;

    this.helpButton = new Button("Help")
    this.helpButton.color = "darkorange"
    this.helpButton.pressedColor = "sandybrown"
    this.helpButton.textColor = "white"
    this.helpButton.visible = true;

    this.startButton = new Button("Start Game")
    this.startButton.color = "lightpink"
    this.startButton.pressedColor = "pink"
    this.startButton.textColor = "DarkSlateGray"
    this.startButton.visible = true
    
    this.undoButton = new Button("Undo Move")
    this.undoButton.color = "lightgreen";
    this.undoButton.color = "green";
    this.undoButton.visible = false;
    this.undoButton.onClick = (() => {
      const prevMove = this.moveHistoryQueue.pop()
      this.tiles[`${prevMove?.col} ${prevMove?.row}`] = undefined
      if(prevMove?.value === 2 || this.moveHistoryQueue.length === 0) {
        this.undoButton.visible = false
      }
      this.currentValue = this.gameState === GameStates.SETUP ? 1 : this.currentValue-1
      if(this.gameState !== GameStates.SETUP){
        this.gameState = GameStates.PLACING
        this.recalculateAllowedMoves();
      } else {
        this.onesPlaced--
      }
      }).bind(this)
    
    this.setButtonSizes()

    this.buttons = [
      this.resetButton,
      this.helpButton,
      this.startButton,
      this.undoButton
    ]

    this.tiles = {};
    this.allowedMoves = {}
    this.moveHistoryQueue = []
  }

  private setButtonSizes() {
    this.resetButton.setSize(15, 15, 150, 40)
    this.helpButton.setSize(15, 15+40+15, 150, 40)
    this.startButton.setSize(15, this.p5.height*0.92, 150, 40)
    this.undoButton.setSize(this.p5.width*0.8, 15, 150, 40)
  }

  mouseScrolled(event: WheelEvent) {
    if(!this.panning) {
      this.zoomLevel = Math.min(this.ZOOM_SETTINGS.ZOOM_STEPS, Math.max(0, this.zoomLevel-event.deltaY/100));
      this.tileWidth = Math.exp(
        this.LOG_MIN_ZOOM + (this.LOG_MAX_ZOOM - this.LOG_MIN_ZOOM) * (this.zoomLevel/this.ZOOM_SETTINGS.ZOOM_STEPS)
      );
    }
  }

  private recalculateAllowedMoves(): number {
    // TODO could be optimized
    // (only recalculate the sum for the newest tile and save the emptySpaceSums for entire game)
    // don't forget undo moves though...
    const emptySpaceSums: TileHashMap<number> = {}
    this.allowedMoves = {}
    for (const locationString in this.tiles) {
      const tileValue = this.tiles[locationString]!
      if(tileValue === undefined) continue;
      const [col, row] = locationString.split(" ").map(Number)

      NEIGHBOUR_OFFSETS.forEach((pos) => {
        const value = this.tiles[`${col+pos[0]} ${row+pos[1]}`]
        if (value === undefined) {
          emptySpaceSums[`${col+pos[0]} ${row+pos[1]}`] ||= 0
          emptySpaceSums[`${col+pos[0]} ${row+pos[1]}`]! += tileValue
        }
      });
    }
    for (const locationString in emptySpaceSums) {
      if (emptySpaceSums[locationString] === this.currentValue) {
        this.allowedMoves[locationString] = true
      }
    }
    return Object.keys(this.allowedMoves).length
  }

  private legalPlacement(col: number, row: number) {
    const neighbourSum =  NEIGHBOUR_OFFSETS.reduce((sum, pos) => {
      return sum + (this.tiles[`${col+pos[0]} ${row+pos[1]}`] || 0)
    }, 0) 
    return neighbourSum === this.currentValue
  }


  windowResized() {
    this.setButtonSizes()
  }

  mouseReleased(mouseX: number, mouseY: number) {
    if (this.startButton.isPressed) {
      this.startButton.isPressed = false;
      if (this.startButton.checkMouseInbounds(mouseX, mouseY)) {
        this.currentValue = 2;
        const legalMoves = this.recalculateAllowedMoves()
        this.gameState = legalMoves === 0 ? GameStates.NO_MOVES : GameStates.PLACING;
        this.startButton.visible = false;
      }
      return
    } else if (this.resetButton.isPressed) {
      this.resetButton.isPressed = false;
      if (this.resetButton.checkMouseInbounds(mouseX, mouseY)) {
        this.setupGame()
      }
      return
    } else if (this.helpButton.isPressed) {
      this.helpButton.isPressed = false;
      window.open('/help.html', '_blank')
      return
    } else if (this.undoButton.isPressed) {
      this.undoButton.isPressed = false;
      if (this.undoButton.checkMouseInbounds(mouseX, mouseY)) {
        this.undoButton.onClick()
      }
      return
    }
    const pannedDist = Math.hypot(mouseX - this.panMouseStartX!, mouseY - this.panMouseStartY!)
    if (pannedDist < 3 || !this.panning) {
      const colSelected = Math.floor((mouseX-this.x)/this.tileWidth);
      const rowSelected = Math.floor((mouseY-this.y)/this.tileWidth);
      
      if(this.tiles[`${colSelected} ${rowSelected}`]) {
        // number already placed on tile
        // const tile = this.tiles[`${colSelected} ${rowSelected}`]
      } else {
        // Empty spot
        if(this.gameState !== GameStates.SETUP){
          if (!this.legalPlacement(colSelected, rowSelected)){
            //Illegal move
            return
          }
        }
        this.tiles[`${colSelected} ${rowSelected}`] = this.currentValue
        this.moveHistoryQueue.push({
          row: rowSelected,
          col: colSelected,
          value: this.currentValue,
        })
        this.undoButton.visible = true
        if(this.gameState === GameStates.PLACING) {
          this.currentValue++;
          const legalMoves = this.recalculateAllowedMoves()
          if (legalMoves === 0) {
            this.gameState = GameStates.NO_MOVES
          }
        } else {
          this.onesPlaced++;
        }
      }
    }
    this.panning = false
  }

  mousePressed(mouseX: number, mouseY: number) {
    this.buttons.forEach((button) => {
      if(button.visible && button.checkMouseInbounds(mouseX, mouseY)){
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
        if (this.allowedMoves[`${firstCol+col} ${firstRow+row}`]) {
          this.p5.circle(firstColOffset + this.tileWidth * (col+0.5), firstRowOffset + this.tileWidth * (row+0.5), this.tileWidth*0.3)
        }
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

    //Drawing score
    let instructionText: string;
    switch(this.gameState) {
      case GameStates.SETUP:
        instructionText = "Place your ones tiles..."
        break;
      case GameStates.PLACING:
        instructionText = `Placing ${this.currentValue} tile.`
        break;
      case GameStates.NO_MOVES:
        instructionText = `Game Over! Score: ${this.currentValue-1} tiles`
        break;
    }
    console.log(instructionText)
    this.p5.fill("brown")
    this.p5.textFont('Verdana', 24);
    this.p5.textAlign("left", 'center')
    this.p5.text(instructionText, 180, 35)

    if(this.gameState != GameStates.SETUP && MAXIMUM_SCORES[this.onesPlaced-1]) {
      const maxScoreText = `Maximum score with ${this.onesPlaced} initial ones tiles: ${MAXIMUM_SCORES[this.onesPlaced-1]}`
      this.p5.textFont('Verdana', 16);
      this.p5.text(maxScoreText, 180, 75)
    }
  }
}