// src/engine.js —— 棋局状态与逻辑循环
// 职责：维护棋盘二维数组、历史栈、当前轮次；对外提供落子/悔棋/查询接口

var BOARD_N = 15;          // 15 路棋盘
var __board = null;        // 棋盘：BOARD_N x BOARD_N，0 空 / 1 黑 / 2 白
var __history = [];        // 历史栈：{x, y, player}，供悔棋
var __turn = 1;            // 当前轮次：1 黑 2 白
var __winner = 0;          // 0 未分胜负，否则胜方棋色

function engineInit() {
  engineReset();
}

function engineReset() {
  __board = [];
  for (var r = 0; r < BOARD_N; r++) {
    var row = [];
    for (var c = 0; c < BOARD_N; c++) row.push(0);
    __board.push(row);
  }
  __history = [];
  __turn = 1;
  __winner = 0;
}

// 在 (x,y) 落子；成功返回 true，非法（越界/已占/已结束）返回 false
function enginePlace(x, y) {
  if (__winner !== 0) return false;
  if (typeof x !== 'number' || typeof y !== 'number') return false;
  if (!isFinite(x) || !isFinite(y)) return false;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || x >= BOARD_N || y < 0 || y >= BOARD_N) return false;
  if (__board[y][x] !== 0) return false;

  var player = __turn;
  __board[y][x] = player;
  __history.push({ x: x, y: y, player: player });

  if (typeof checkFive === 'function' && checkFive(__board, x, y)) {
    __winner = player;
  } else {
    __turn = (player === 1) ? 2 : 1;
  }
  return true;
}

// 悔棋：撤销最近一步并还原轮次；无可悔返回 false
function engineUndo() {
  if (__history.length === 0) return false;
  var last = __history.pop();
  __board[last.y][last.x] = 0;
  __turn = last.player;
  __winner = 0;
  return true;
}

// 查询接口（供 ui 渲染）
function engineGetBoard() { return __board; }
function engineGetTurn() { return __turn; }
function engineGetWinner() { return __winner; }

// 每帧逻辑（当前为轮询空转，交互驱动为主）
function engineTick() {
  // 预留动画/计时扩展点：当前交互驱动，无逐帧状态需要更新
}
