// src/ui.js —— 界面渲染与交互
// 职责：canvas 绘制棋盘/棋子/提示；stage 内挂 absolute 覆盖层按钮；绑定点击

var __g = null;        // 2D 上下文引用
var __elRoot = null;   // 覆盖层容器（absolute，挂 stage）
var __onCanvasClick = null; // 点击监听引用，destroy 时解绑
var __canvasRef = null;     // 画布引用，destroy 时解绑用

var __btnUndo = null;    // 悔棋按钮
var __txtTurn = null;    // 轮次/胜负文本
var __cell = 0;          // 每格像素尺寸
var __ox = 0;            // 棋盘左上原点 x
var __oy = 0;            // 棋盘左上原点 y
var __lastW = 0;
var __lastH = 0;

// 胜利五连：优先取引擎/实体提供的结果，否则本地扫描
function __findWinLine() {
  try {
    if (typeof engineGetWinLine === 'function') {
      var w = engineGetWinLine();
      if (w && w.length) return w;
    }
  } catch (e) {}
  var n = BOARD_N;
  var b = engineGetBoard();
  if (!b) return null;
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < n; c++) {
      var v = b[r][c];
      if (!v) continue;
      for (var d = 0; d < dirs.length; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        var cnt = 1, cells = [[r, c]];
        for (var k = 1; k < 5; k++) {
          var rr = r + dr * k, cc = c + dc * k;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n || b[rr][cc] !== v) break;
          cnt++; cells.push([rr, cc]);
        }
        if (cnt >= 5) return cells;
      }
    }
  }
  return null;
}

function __updateTurnText() {
  if (!__txtTurn) return;
  var s = '';
  try {
    if (typeof engineGetStatus === 'function') {
      s = engineGetStatus() || '';
    }
  } catch (e) {}
  if (!s) {
    var b = engineGetBoard();
    var win = __findWinLine();
    if (win && b) {
      var v = b[win[0][0]][win[0][1]];
      s = (v === 1 ? '黑方胜' : '白方胜');
    } else {
      var turn = 1;
      try {
        if (typeof engineGetTurn === 'function') turn = engineGetTurn();
        else {
          var cnt = 0;
          for (var r = 0; r < BOARD_N; r++)
            for (var c = 0; c < BOARD_N; c++)
              if (b[r][c]) cnt++;
          turn = (cnt % 2 === 0) ? 1 : 2;
        }
      } catch (e2) {}
      s = (turn === 1 ? '黑方回合' : '白方回合');
    }
  }
  __txtTurn.textContent = s;
}

function uiInit(canvas, g, stage) {
  __g = g;
  __canvasRef = canvas;
  __elRoot = document.createElement('div');
  __elRoot.style.position = 'absolute';
  __elRoot.style.left = '0';
  __elRoot.style.top = '0';
  __elRoot.style.width = '100%';
  __elRoot.style.height = '100%';
  __elRoot.style.pointerEvents = 'none';
  stage.appendChild(__elRoot);

  __btnUndo = document.createElement('button');
  __btnUndo.textContent = '悔棋';
  __btnUndo.style.position = 'absolute';
  __btnUndo.style.pointerEvents = 'auto';
  __btnUndo.style.padding = '4px 14px';
  __btnUndo.style.fontSize = '14px';
  __btnUndo.onclick = function () {
    if (typeof engineUndo === 'function') engineUndo();
    __updateTurnText();
  };
  __elRoot.appendChild(__btnUndo);

  __txtTurn = document.createElement('div');
  __txtTurn.style.position = 'absolute';
  __txtTurn.style.fontSize = '18px';
  __txtTurn.style.fontWeight = 'bold';
  __txtTurn.style.color = '#333';
  __txtTurn.style.pointerEvents = 'none';
  __elRoot.appendChild(__txtTurn);

  __onCanvasClick = function (ev) {
    var rect = canvas.getBoundingClientRect();
    var x = ev.clientX - rect.left;
    var y = ev.clientY - rect.top;
    var cellIdx = hitToCell(x, y);
    if (!cellIdx) return;
    var r = cellIdx.r, c = cellIdx.c;
    if (r == null || c == null || r < 0 || c < 0 || r >= BOARD_N || c >= BOARD_N) return;
    if (typeof enginePlace === 'function') enginePlace(r, c);
    __updateTurnText();
  };
  canvas.addEventListener('click', __onCanvasClick);
}

// 尺寸变化：重排棋盘与覆盖层
function uiLayout(w, h) {
  __lastW = w; __lastH = h;
  var fit = boardFit(w, h, BOARD_N);
  __cell = fit.cell;
  __ox = fit.ox;
  __oy = fit.oy;
  if (__btnUndo) {
    __btnUndo.style.left = Math.max(8, w / 2 - 120) + 'px';
    __btnUndo.style.top = (h - 40) + 'px';
  }
  if (__txtTurn) {
    __txtTurn.style.left = Math.max(8, w / 2 + 20) + 'px';
    __txtTurn.style.top = (h - 42) + 'px';
  }
}

// 每帧渲染
function uiRender(g, w, h) {
  if (w !== __lastW || h !== __lastH) uiLayout(w, h);
  g.clearRect(0, 0, w, h);

  // 背景
  g.fillStyle = '#d8b26e';
  g.fillRect(__ox, __oy, __cell * (BOARD_N - 1) + __cell, __cell * (BOARD_N - 1) + __cell);

  // 网格线
  g.strokeStyle = '#5a3a1a';
  g.lineWidth = 1;
  g.beginPath();
  for (var i = 0; i < BOARD_N; i++) {
    var px = __ox + __cell / 2 + i * __cell;
    g.moveTo(px, __oy + __cell / 2);
    g.lineTo(px, __oy + __cell / 2 + (BOARD_N - 1) * __cell);
    var py = __oy + __cell / 2 + i * __cell;
    g.moveTo(__ox + __cell / 2, py);
    g.lineTo(__ox + __cell / 2 + (BOARD_N - 1) * __cell, py);
  }
  g.stroke();

  var b = engineGetBoard();
  if (!b) return;
  var rad = __cell * 0.4;
  for (var r = 0; r < BOARD_N; r++) {
    for (var c = 0; c < BOARD_N; c++) {
      var v = b[r][c];
      if (!v) continue;
      var cx = __ox + __cell / 2 + c * __cell;
      var cy = __oy + __cell / 2 + r * __cell;
      g.beginPath();
      g.arc(cx, cy, rad, 0, Math.PI * 2);
      g.fillStyle = (v === 1) ? '#111' : '#fff';
      g.fill();
      g.strokeStyle = '#000';
      g.stroke();
    }
  }

  // 胜利高亮五连
  var line = __findWinLine();
  if (line) {
    g.strokeStyle = '#e03030';
    g.lineWidth = 3;
    for (var k = 0; k < line.length; k++) {
      var cx2 = __ox + __cell / 2 + line[k][1] * __cell;
      var cy2 = __oy + __cell / 2 + line[k][0] * __cell;
      g.beginPath();
      g.arc(cx2, cy2, rad + 3, 0, Math.PI * 2);
      g.stroke();
    }
  }

  __updateTurnText();
}

function uiDestroy() {
  if (__onCanvasClick && __canvasRef && __canvasRef.removeEventListener) {
    __canvasRef.removeEventListener('click', __onCanvasClick);
  }
  __onCanvasClick = null;
  if (__elRoot && __elRoot.parentNode) {
    __elRoot.parentNode.removeChild(__elRoot);
  }
  __elRoot = null;
  __btnUndo = null;
  __txtTurn = null;
  __canvasRef = null;
  __g = null;
}
