// 纯 Canvas 绘制的「模拟系统界面截图」生成器。
// 用途：为内置示例项目生成直观的演示截图（含红框/序号角标），不依赖任何外部图片资源。
// 后续用户导入真实截图后，示例项目可随时在界面上删除。

export type MockVariant = "login" | "roleList" | "roleForm";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

const BRAND = "#1E3A8A";
const BRAND_DARK = "#0F172A";
const HIGHLIGHT = "#FF2E2E";
const CARD_BG = "#FFFFFF";
const BORDER = "#CBD5E1";
const TEXT = "#0F172A";
const TEXT_MUTED = "#64748B";

export interface RenderedMock {
  rawBase64: string;
  annotatedBase64: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** 1x1 透明 PNG，用于 Canvas 不可用时（如非浏览器环境）的安全兜底 */
const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/** 高亮红框：3px 描边 + 4px 圆角 + 6% 半透明填充 */
function drawHighlightRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.strokeStyle = HIGHLIGHT;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 46, 46, 0.06)";
  ctx.fill();
  ctx.restore();
}

/** 数字序号角标：红底白字实心圆 + 白色描边 */
function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = HIGHLIGHT;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

interface LabeledInputOptions {
  mask?: boolean;
  value?: string;
}

function drawLabeledInput(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  options: LabeledInputOptions = {},
): void {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#334155";
  ctx.font = "13px sans-serif";
  ctx.fillText(label, x, y - 8);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (options.mask) {
    ctx.fillStyle = "#94A3B8";
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 16 + i * 14, y + h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (options.value) {
    ctx.fillStyle = TEXT;
    ctx.font = "13px sans-serif";
    ctx.fillText(options.value, x + 12, y + h / 2 + 5);
  }
  ctx.restore();
}

function drawSelectField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
): void {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#334155";
  ctx.font = "13px sans-serif";
  ctx.fillText(label, x, y - 8);
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.font = "13px sans-serif";
  ctx.fillText(value, x + 12, y + h / 2 + 5);
  // 下拉箭头
  ctx.beginPath();
  ctx.moveTo(x + w - 20, y + h / 2 - 3);
  ctx.lineTo(x + w - 12, y + h / 2 - 3);
  ctx.lineTo(x + w - 16, y + h / 2 + 3);
  ctx.closePath();
  ctx.fillStyle = TEXT_MUTED;
  ctx.fill();
  ctx.restore();
}

function drawLogin(ctx: CanvasRenderingContext2D, annotated: boolean): void {
  ctx.fillStyle = "#EFF3FA";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 顶部品牌条
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 64);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("智能办公管理系统", 32, 34);

  // 登录卡片
  const cardX = 300;
  const cardY = 120;
  const cardW = 360;
  const cardH = 360;
  roundRect(ctx, cardX, cardY, cardW, cardH, 12);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = TEXT;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("账号登录", cardX + cardW / 2, cardY + 48);

  drawLabeledInput(ctx, cardX + 40, cardY + 96, cardW - 80, 44, "账号", {
    value: "zhangwei",
  });
  drawLabeledInput(ctx, cardX + 40, cardY + 168, cardW - 80, 44, "密码", {
    mask: true,
  });

  const loginBtn = { x: cardX + 40, y: cardY + 248, w: cardW - 80, h: 44 };
  roundRect(ctx, loginBtn.x, loginBtn.y, loginBtn.w, loginBtn.h, 6);
  ctx.fillStyle = BRAND;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("登 录", loginBtn.x + loginBtn.w / 2, loginBtn.y + loginBtn.h / 2);

  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "12px sans-serif";
  ctx.fillText("忘记密码？请联系系统管理员重置", cardX + cardW / 2, cardY + 330);

  if (annotated) {
    drawHighlightRect(ctx, loginBtn.x, loginBtn.y, loginBtn.w, loginBtn.h);
    drawBadge(ctx, loginBtn.x, loginBtn.y, "1");
  }
}

/** 绘制后台管理页面骨架：侧边栏 + 顶部栏 + 页面标题 */
function drawAppFrame(
  ctx: CanvasRenderingContext2D,
  activeMenu: string,
  breadcrumb: string,
  title: string,
): void {
  ctx.fillStyle = "#EEF2F7";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 侧边栏
  ctx.fillStyle = BRAND_DARK;
  ctx.fillRect(0, 0, 200, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("OA 管理系统", 24, 40);

  const menus = ["工作台", "系统管理", "角色权限", "组织架构", "操作日志"];
  menus.forEach((menu, index) => {
    const y = 96 + index * 44;
    if (menu === activeMenu) {
      ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      roundRect(ctx, 12, y - 18, 176, 36, 6);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
    } else {
      ctx.fillStyle = "#94A3B8";
    }
    ctx.font = "14px sans-serif";
    ctx.fillText(menu, 36, y);
  });

  // 顶部栏
  ctx.fillStyle = CARD_BG;
  ctx.fillRect(200, 0, CANVAS_WIDTH - 200, 56);
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(200, 55, CANVAS_WIDTH - 200, 1);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "13px sans-serif";
  ctx.fillText(breadcrumb, 224, 28);

  // 页面标题
  ctx.fillStyle = TEXT;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(title, 224, 96);
}

function drawRoleList(ctx: CanvasRenderingContext2D, annotated: boolean): void {
  drawAppFrame(ctx, "角色权限", "首页 / 系统管理 / 角色权限", "角色管理");

  // 新增角色按钮
  const addBtn = { x: 700, y: 78, w: 120, h: 36 };
  roundRect(ctx, addBtn.x, addBtn.y, addBtn.w, addBtn.h, 6);
  ctx.fillStyle = BRAND;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+ 新增角色", addBtn.x + addBtn.w / 2, addBtn.y + addBtn.h / 2 + 1);

  // 查询栏
  ctx.textAlign = "left";
  drawLabeledInput(ctx, 224, 160, 220, 36, "角色名称");
  const queryBtn = { x: 470, y: 160, w: 72, h: 36 };
  roundRect(ctx, queryBtn.x, queryBtn.y, queryBtn.w, queryBtn.h, 6);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.font = "14px sans-serif";
  ctx.fillText("查询", queryBtn.x + 24, queryBtn.y + 24);

  // 数据表格
  const table = { x: 224, y: 244, w: 700, rowH: 40, headerH: 40 };
  const colRatios = [0.2, 0.24, 0.14, 0.42];
  const headers = ["角色编码", "角色名称", "状态", "操作"];
  const rows = [
    ["ADMIN", "系统管理员", "启用", "编辑    分配权限    删除"],
    ["FIN_AUDITOR", "财务审核员", "启用", "编辑    分配权限    删除"],
    ["HR_VIEWER", "人事查看员", "停用", "编辑    分配权限    删除"],
    ["GUEST", "访客", "启用", "编辑    分配权限    删除"],
  ];
  const totalH = table.headerH + table.rowH * rows.length;

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(table.x, table.y, table.w, totalH);
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(table.x, table.y, table.w, table.headerH);
  ctx.strokeRect(table.x, table.y, table.w, table.headerH);

  // 竖向网格线
  let accX = table.x;
  for (const ratio of colRatios) {
    accX += ratio * table.w;
    ctx.beginPath();
    ctx.moveTo(accX, table.y);
    ctx.lineTo(accX, table.y + totalH);
    ctx.stroke();
  }
  // 横向网格线
  for (let i = 1; i <= rows.length; i += 1) {
    const y = table.y + table.headerH + i * table.rowH;
    ctx.beginPath();
    ctx.moveTo(table.x, y);
    ctx.lineTo(table.x + table.w, y);
    ctx.stroke();
  }

  const colLeft = (index: number): number => {
    const before = colRatios.slice(0, index).reduce((a, b) => a + b, 0);
    return table.x + before * table.w + 12;
  };

  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.textBaseline = "middle";
  headers.forEach((header, i) => {
    ctx.fillText(header, colLeft(i), table.y + table.headerH / 2);
  });

  rows.forEach((row, r) => {
    const cy = table.y + table.headerH + r * table.rowH + table.rowH / 2;
    row.forEach((cell, c) => {
      if (c === 2 && cell === "停用") {
        ctx.fillStyle = TEXT_MUTED;
      } else if (c === 3) {
        ctx.fillStyle = "#2563EB";
      } else {
        ctx.fillStyle = TEXT;
      }
      ctx.font = "13px sans-serif";
      ctx.fillText(cell, colLeft(c), cy);
    });
  });

  if (annotated) {
    drawHighlightRect(ctx, addBtn.x, addBtn.y, addBtn.w, addBtn.h);
    drawBadge(ctx, addBtn.x, addBtn.y, "1");
  }
}

function drawRoleForm(ctx: CanvasRenderingContext2D, annotated: boolean): void {
  drawAppFrame(ctx, "角色权限", "首页 / 系统管理 / 角色权限", "新增角色");

  // 表单抽屉
  const card = { x: 240, y: 130, w: 680, h: 380 };
  roundRect(ctx, card.x, card.y, card.w, card.h, 10);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  drawLabeledInput(ctx, card.x + 32, card.y + 72, 300, 36, "角色编码 *", {
    value: "FIN_AUDITOR",
  });
  drawLabeledInput(ctx, card.x + 32, card.y + 152, 300, 36, "角色名称 *", {
    value: "财务审核员",
  });
  drawSelectField(ctx, card.x + 32, card.y + 232, 300, 36, "状态", "启用");
  drawLabeledInput(ctx, card.x + 32, card.y + 312, card.w - 64, 36, "备注", {
    value: "负责财务单据的审核与驳回操作",
  });

  // 底部操作按钮
  const cancelBtn = { x: card.x + card.w - 240, y: card.y + card.h + 24, w: 88, h: 36 };
  const okBtn = { x: card.x + card.w - 132, y: card.y + card.h + 24, w: 88, h: 36 };

  roundRect(ctx, cancelBtn.x, cancelBtn.y, cancelBtn.w, cancelBtn.h, 6);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("取消", cancelBtn.x + cancelBtn.w / 2, cancelBtn.y + cancelBtn.h / 2 + 1);

  roundRect(ctx, okBtn.x, okBtn.y, okBtn.w, okBtn.h, 6);
  ctx.fillStyle = BRAND;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("确定", okBtn.x + okBtn.w / 2, okBtn.y + okBtn.h / 2 + 1);

  if (annotated) {
    drawHighlightRect(ctx, okBtn.x, okBtn.y, okBtn.w, okBtn.h);
    drawBadge(ctx, okBtn.x, okBtn.y, "1");
  }
}

function drawMock(
  ctx: CanvasRenderingContext2D,
  variant: MockVariant,
  annotated: boolean,
): void {
  switch (variant) {
    case "login":
      drawLogin(ctx, annotated);
      break;
    case "roleList":
      drawRoleList(ctx, annotated);
      break;
    case "roleForm":
      drawRoleForm(ctx, annotated);
      break;
  }
}

/**
 * 渲染一张模拟系统界面截图，返回「原图」与「带红框序号标注的合成图」两套 Base64。
 */
export function renderMockScreenshot(variant: MockVariant): RenderedMock {
  if (typeof document === "undefined") {
    return {
      rawBase64: TRANSPARENT_PIXEL,
      annotatedBase64: TRANSPARENT_PIXEL,
      naturalWidth: CANVAS_WIDTH,
      naturalHeight: CANVAS_HEIGHT,
    };
  }

  const rawCanvas = createCanvas();
  const annotatedCanvas = createCanvas();
  const rawCtx = rawCanvas.getContext("2d");
  const annotatedCtx = annotatedCanvas.getContext("2d");
  if (!rawCtx || !annotatedCtx) {
    return {
      rawBase64: TRANSPARENT_PIXEL,
      annotatedBase64: TRANSPARENT_PIXEL,
      naturalWidth: CANVAS_WIDTH,
      naturalHeight: CANVAS_HEIGHT,
    };
  }

  drawMock(rawCtx, variant, false);
  drawMock(annotatedCtx, variant, true);

  return {
    rawBase64: rawCanvas.toDataURL("image/png"),
    annotatedBase64: annotatedCanvas.toDataURL("image/png"),
    naturalWidth: CANVAS_WIDTH,
    naturalHeight: CANVAS_HEIGHT,
  };
}

/** 模拟截图中红框与序号角标的归一化坐标（与上述绘制逻辑保持一致） */
export const MOCK_ANNOTATION_COORDS: Record<MockVariant, { rect: [number, number, number, number]; badge: [number, number] }> = {
  login: {
    rect: [340 / CANVAS_WIDTH, 368 / CANVAS_HEIGHT, 280 / CANVAS_WIDTH, 44 / CANVAS_HEIGHT],
    badge: [340 / CANVAS_WIDTH, 368 / CANVAS_HEIGHT],
  },
  roleList: {
    rect: [700 / CANVAS_WIDTH, 78 / CANVAS_HEIGHT, 120 / CANVAS_WIDTH, 36 / CANVAS_HEIGHT],
    badge: [700 / CANVAS_WIDTH, 78 / CANVAS_HEIGHT],
  },
  roleForm: {
    rect: [788 / CANVAS_WIDTH, 534 / CANVAS_HEIGHT, 88 / CANVAS_WIDTH, 36 / CANVAS_HEIGHT],
    badge: [788 / CANVAS_WIDTH, 534 / CANVAS_HEIGHT],
  },
};
