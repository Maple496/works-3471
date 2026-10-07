// src/entities.js —— 规则与几何实体
// 职责：五连判定、屏幕坐标↔棋盘坐标换算、棋盘格子尺寸管理

var CELL = 36; // 每格像素（boardFit 时重算）
var MARGIN = 20; // 棋盘边距

// 五连判定：以 (x,y) 为落子点，检查四方向（横、竖、两条斜线）是否成五
// 连续同色计数（含落子点本身），≥5 即返回该棋色；返回胜方棋色或 0
function checkFive(board, x, y) {
  if (!board || y < 0 || y >= board.length) return 0;
  var row = board[y];
  if (!row || x < 0 || x >= row.length) return 0;
  var p = board[y][x];
  if (!p) return 0;
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
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

// 当前布局状态（由 boardFit 记录，供换算使用）
// BOARD_N：棋盘路数；BOARD_OX/BOARD_OY：棋盘绘制原点（格 (0,0) 左上角的屏幕坐标）
var BOARD_N = 15;
var BOARD_OX = MARGIN;
var BOARD_OY = MARGIN;

// 屏幕坐标 → 棋盘格坐标；不在盘内返回 null
// px/py：屏幕坐标；boardPixelSize：棋盘绘制区域的边长（含边距），
// 可省略（默认由当前 BOARD_N * CELL + 2 * MARGIN 推出）
// 返回 {x, y}：棋盘格的列、行下标（0 起，x 列 / y 行）
function hitToCell(px, py, boardPixelSize) {
  if (!(boardPixelSize > 0)) {
    boardPixelSize = BOARD_N * CELL + 2 * MARGIN;
  }
  var inner = boardPixelSize - 2 * MARGIN;
  if (inner <= 0) return null;
  var n = BOARD_N;
  if (n <= 0) return null;
  var lx = px - BOARD_OX;
  var ly = py - BOARD_OY;
  if (lx < 0 || ly < 0 || lx >= inner || ly >= inner) return null;
  var x = Math.floor(lx / CELL);
  var y = Math.floor(ly / CELL);
  if (x < 0 || y < 0 || x >= n || y >= n) return null;
  return { x: x, y: y };
}

// 棋盘格坐标 → 格中心屏幕坐标（与 hitToCell 互逆）
function cellToPixel(x, y) {
  return {
    px: BOARD_OX + x * CELL + CELL / 2,
    py: BOARD_OY + y * CELL + CELL / 2
  };
}

// 布局变化时按画布尺寸重算 CELL/MARGIN，保证 boardN 路棋盘完整放入画布
// 返回 { cell, margin, ox, oy }：ox/oy 为棋盘原点（格 (0,0) 左上角屏幕坐标），
// 满足互逆性：cellToPixel(hitToCell(px,py)) 的中心与 hitToCell(cellToPixel(x,y)) 一致
function boardFit(canvasW, canvasH, boardN) {
  if (!(boardN > 0)) boardN = 15;
  BOARD_N = boardN;
  var minSide = Math.min(canvasW, canvasH);
  CELL = Math.max(8, Math.floor((minSide - 2 * 12) / boardN));
  var inner = CELL * boardN;
  MARGIN = Math.max(0, Math.floor((Math.min(canvasW, canvasH) - inner) / 2));
  BOARD_OX = MARGIN;
  BOARD_OY = MARGIN;
  return { cell: CELL, margin: MARGIN, ox: BOARD_OX, oy: BOARD_OY };
}
