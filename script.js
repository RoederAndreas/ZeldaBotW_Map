'use strict';

const global = {
    canvas: null,
    ctx: null,
    grid: {
        rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    },
    tileSize: 2000,
    position: {x: 0, y: 0},
    zoom: 1,
    tiles: [],
    visibleTiles: [],
    mouseDown: false,
    lastMousePosition: {x: 0, y: 0}
};

let debug = function() {
    document.getElementById('debug-map-position').innerHTML = `x${global.position.x} y${global.position.y}`;
    document.getElementById('debug-zoom-level').innerHTML = global.zoom;
}

let centerPosition = function() {
    global.position.x = global.grid.columns.length * global.tileSize / 2;
    global.position.y = global.grid.rows.length * global.tileSize / 2;
}

let translatePositionToScreen = function(position) {
    let viewWidth = global.canvas.width;
    let viewHeight = global.canvas.height;
    let offset = {x: viewWidth / 2, y: viewHeight / 2};
    return {
        x: (position.x - global.position.x) * global.zoom + offset.x,
        y:  (position.y - global.position.y) * global.zoom + offset.y
    };
};

let drawTile = function() {
    if (!this.loaded) {
        this.image.addEventListener('load', this.draw);
        return;
    }
    let ctx = global.ctx;
    let size = global.tileSize * global.zoom;
    let pos = translatePositionToScreen({x: this.gridPosition.x * global.tileSize, y: this.gridPosition.y * global.tileSize});
    ctx.drawImage(this.image, pos.x, pos.y, size, size);
}

let initializeTiles = function() {
    let grid = global.grid;
    for (let y = 0; y < grid.rows.length; y++) {
        global.tiles[y] = [];
        for (let x = 0; x < grid.columns.length; x++) {
            let tile = {
                loaded: false,
                gridPosition: {x: x, y: y},
                image: new Image()
            };
            tile.draw = drawTile.bind(tile);
            let onLoad = function() {tile.loaded = true;};
            tile.image.addEventListener('load', onLoad);
            tile.image.src = `tiles/MapTex_${grid.columns[x]}-${grid.rows[y]}.png`;
            global.tiles[y][x] = tile;
        }
    }
}

let updateVisibleTiles = function() {
    let viewWidth = global.canvas.width;
    let viewHeight = global.canvas.height;
    let offset = {x: viewWidth / 2, y: viewHeight / 2};
    let relativeOffset = {x: offset.x * (1 / global.zoom), y: offset.y * (1 / global.zoom)};
    let boundaries = {
        left: Math.floor((global.position.x - relativeOffset.x) / global.tileSize),
        right: Math.floor((global.position.x + relativeOffset.x) / global.tileSize),
        top: Math.floor((global.position.y - relativeOffset.y) / global.tileSize),
        bottom: Math.floor((global.position.y + relativeOffset.y) / global.tileSize)
    };
    global.visibleTiles = [];
    for (let y = boundaries.top; y <= boundaries.bottom; y++) {
        if (!global.tiles[y]) continue;
        for (let x = boundaries.left; x <= boundaries.right; x++) {
            if (global.tiles[y][x]) global.visibleTiles.push(global.tiles[y][x]);
        }
    }
};

let repaint = function() {
    debug();
    updateVisibleTiles();
    let ctx = global.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let tile of global.visibleTiles) tile.draw();
};

let resizeCanvas = function() {
    let parent = global.canvas.parentNode;
    global.canvas.width = parent.clientWidth;
    global.canvas.height = parent.clientHeight;
    repaint();
};

let startDragging = function(event) {
    global.mouseDown = true;
    global.canvas.setAttribute('data-dragging', 'true');
    global.lastMousePosition = {x: event.clientX, y: event.clientY};
};

let drag = function(event) {
    if (!global.mouseDown) return;
    let movement = {
        x: event.clientX - global.lastMousePosition.x,
        y: event.clientY - global.lastMousePosition.y
    };
    global.position.x -= movement.x * (1 / global.zoom);
    global.position.y -= movement.y * (1 / global.zoom);
    global.lastMousePosition = {x: event.clientX, y: event.clientY};
    repaint();
};

let stopDragging = function() {
    global.mouseDown = false;
    global.canvas.setAttribute('data-dragging', 'false');
};

let zoom = function(event) {
    global.zoom += event.deltaY * -0.01;
    if (global.zoom > 1) global.zoom = 1;
    if (global.zoom < 0.05) global.zoom = 0.05;
    repaint();
};

window.addEventListener('load', function() {
    initializeTiles();
    centerPosition();
    global.canvas = document.getElementById('map');
    global.ctx = global.canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    global.canvas.addEventListener('mousedown', startDragging);
    global.canvas.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('wheel', zoom);
    resizeCanvas();
});
