let ctx;

let startDragX;
let startDragY;
let cameraX = 0;
let cameraY = 0;
let mouseDown;

let canDraw = true

console.log("JS Loaded...")

const colors = {blue: "#0000FF", "red": "#FF0000", "green": "#00FF00", "orange": "#FFA500", "brown": "#964B00", "black": "#000000", "offwhite": "#FAF9F6"}
let tiles = [new Tile(0, 0, 1), new Tile(1, 1, 2), new Tile(-1, -1, 3), new Tile(2, 2, 4), new Tile(-2, -2, 5)];

function drawGrid() {   
    if (!canDraw) {
        return;
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 800, 800);

    tiles.forEach((tile) => {
        let xPos = tile[0] * 100
        let yPos = tile[1] * 100

        if (cameraX-100 < xPos && xPos < cameraX+800){
            if (cameraY-100 < yPos && yPos < cameraY+800) {

                if (tile.value = 1) {
                    ctx.fillStyle = colors.brown;
                } else {
                    ctx.fillStyle = colors.offwhite
                }
                ctx.fillRect(xPos-cameraX, yPos-cameraY, 100, 100);
            }
        }
    });

    ctx.strokeStyle = colors["black"]
    for(let i = 0; i <= 8; i ++) {

        ctx.beginPath();
        ctx.moveTo(
            -cameraX%100 + i*100,
            0,
        )
        ctx.lineTo(
            -cameraX%100 + i*100,
            800);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(
            0,
            -cameraY%100 + i*100,
        )
        ctx.lineTo(
            800,
            -cameraY%100 + i*100,
        );
        ctx.stroke();
        
    }

    canDraw = false;
    setTimeout(() => {
        canDraw = true;
    }, 16);
}

window.addEventListener('load', function() {

    ctx = $("#infinite-board").get(0).getContext("2d");

    drawGrid();

    $("#infinite-board").on("mousedown", (e) => {
        startDragX = cameraX + e.offsetX;
        startDragY = cameraY + e.offsetY;
        mouseDown = true;
    });

    $("#infinite-board").on("mouseup", (e) => { 
        mouseDown = false;
    });

    $("#infinite-board").on("mouseout", (e) => { 
        mouseDown = false;
    });

    $("#infinite-board").on("mousemove", (e) => { 
        if(mouseDown) {
            cameraX = startDragX - e.offsetX;
            cameraY = startDragY- e.offsetY;
            drawGrid();
        }
    });

});