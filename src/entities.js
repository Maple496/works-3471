// src/entities.js —— 规则与几何实体
// 职责：五连判定、屏幕坐标↔棋盘坐标换算、棋盘格子尺寸管理

var CELL = 36; // 每格像素（uiLayout 时重算）
var MARGIN = 20; // 棋盘边距

// 五连判定：以 (x,y) 为落子点，检查四方向是否成五；返回胜方棋色或 0
function checkFive(board, x, y) {
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var p = board[y][x];
  if (!p) return 0;
  for (var i = 0; i < dirs.length; i++) {
    var dx = dirs[i][0], dy = dirs[i][1];
    var cnt = 1;
    // 正方向延伸
    var nx = x + dx, ny = y + dy;
    while (
      ny >= 0 && ny < board.length &&
      nx >= 0 && nx < board[ny].length &&
      board[ny][nx] === p
    ) {
      cnt++;
      nx += dx;
      ny += dy;
    }
    // 负方向延伸
    nx = x - dx;
    ny = y - dy;
    while (
      ny >= 0 && ny < board.length &&
      nx >= 0 && nx < board[ny].length &&
      board[ny][nx] === p
    ) {
      cnt++;
      nx -= dx;
      ny -= dy;
    }
    if (cnt >= 5) return p;
  }
  return 0;
}

// 屏幕坐标 → 棋盘格坐标；不在盘内返回 null
function hitToCell(px, py, boardPixelSize) {
  var inner = boardPixelSize - 2 * MARGIN;
  if (inner <= 0) return null;
  var n = Math.round(inner / CELL);
  if (n <= 0) return null;
  var lx = px - MARGIN;
  var ly = py - MARGIN;
  if (lx < 0 || ly < 0 || lx >= inner || ly >= inner) return null;
  var x = Math.floor(lx / CELL);
  var y = Math.floor(ly / CELL);
  if (x < 0 || y < 0 || x >= n || y >= n) return null;
  return { x: x, y: y };
}

// 棋盘格坐标 → 格中心屏幕坐标
function cellToPixel(x, y) {
  return {
    px: MARGIN + x * CELL + CELL / 2,
    py: MARGIN + y * CELL + CELL / 2
  };
}

// 布局变化时按画布尺寸重算 CELL/MARGIN
function boardFit(canvasW, canvasH, boardN) {
  var minSide = Math.min(canvasW, canvasH);
  CELL = Math.max(8, Math.floor((minSide - 2 * 12) / boardN));
  var inner = CELL * boardN;
  MARGIN = Math.max(0, Math.floor((Math.min(canvasW, canvasH) - inner) / 2));
  return { cell: CELL, margin: MARGIN };
}
