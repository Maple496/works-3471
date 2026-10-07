// src/main.js —— 入口与容器合同
// 职责：创建 canvas、绑定尺寸跟随、装配 engine 与 ui、提供 mount/destroy 生命周期

var __rafId = null;        // RAF 句柄（Work.register 闭包可见）
var __onBounds = null;     // 边界回调引用，destroy 时解绑
var __ctx = null;          // 容器引用，destroy 时清理覆盖层

function mount(ctx) {
  // ctx 平台容器对象：bounds / stage / onBounds
  __ctx = ctx;
  var canvas = document.createElement('canvas');
  var g = canvas.getContext('2d'); // 自建 2D 上下文固定命名 g
  canvas.width = ctx.bounds.w || 360;
  canvas.height = ctx.bounds.h || 360;
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.top = '0';
  ctx.stage.appendChild(canvas);

  // 尺寸跟随（平台注册时会立即补发一次当前值）
  __onBounds = function (b) {
    canvas.width = b.w;
    canvas.height = b.h;
    uiLayout(b.w, b.h);
  };
  ctx.onBounds(__onBounds);

  // 装配模块
  engineInit();
  uiInit(canvas, g, ctx.stage);
  uiLayout(canvas.width, canvas.height);

  // 主循环：RAF 句柄保存为闭包可见变量
  function loop() {
    engineTick();
    uiRender(g, canvas.width, canvas.height);
    __rafId = requestAnimationFrame(loop);
  }
  __rafId = requestAnimationFrame(loop);

  return { canvas: canvas };
}

function destroy() {
  // 取消 RAF（无头冒烟断言零残留帧）
  if (__rafId !== null) {
    cancelAnimationFrame(__rafId);
    __rafId = null;
  }
  uiDestroy();   // 移除覆盖层 DOM、解绑输入监听
  engineReset(); // 清空引擎状态
  __onBounds = null;
  __ctx = null;
}

Work.register({
  name: 'gomoku',
  mount: mount,
  destroy: destroy
});
