#!/usr/bin/env node
// 生成 .duo 并排图块的 HTML，比例从图片文件实际尺寸读，不用手抄。
//
//   node tools/duo.mjs laputa.webp spirited.webp arrietty.webp
//   node tools/duo.mjs "laputa.webp:Laputa: Castle in the Sky" "spirited.webp:Spirited Away"
//
// 每个参数是 文件[:说明文字]，以第一个冒号分割（文件名里不会有冒号，
// 所以说明文字里的冒号不受影响）。只写文件名时按 --dir 解析，
// 默认 public/beyond；写带 / 的路径则按仓库根目录解析。
// 输出在 stdout（可直接重定向），比例表和提醒在 stderr。

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function usage(msg) {
  if (msg) console.error("错误：" + msg);
  console.error(
    "\n用法：node tools/duo.mjs <文件[:说明]> [<文件[:说明]> ...] [选项]\n\n" +
      "选项：\n" +
      "  --dir <目录>   只写文件名时去哪里找（默认 public/beyond）\n" +
      "  --no-cap      不显示说明文字那一行\n" +
      "\n例：node tools/duo.mjs a.webp \"b.webp:B 的说明\" --dir public/photos\n"
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const files = [];
let dir = "public/beyond";
let cap = true;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dir") {
    dir = argv[++i];
    if (!dir) usage("--dir 后面要给目录");
  } else if (a === "--no-cap") {
    cap = false;
  } else if (a.startsWith("--")) {
    usage("不认识的选项 " + a);
  } else {
    const at = a.indexOf(":");
    files.push(at === -1 ? { file: a, caption: "" } : { file: a.slice(0, at), caption: a.slice(at + 1) });
  }
}

if (files.length === 0) usage("至少要给一张图");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const items = [];
const warns = [];
const missing = [];
let sum = 0;

for (const { file, caption } of files) {
  const abs = file.includes("/") ? path.resolve(ROOT, file) : path.resolve(ROOT, dir, file);
  const rel = path.relative(ROOT, abs);

  let meta;
  try {
    meta = await sharp(abs).metadata();
  } catch {
    missing.push(rel);
    continue;
  }
  if (!meta.width || !meta.height) warns.push(`读不到尺寸：${rel}`);

  // URL 路径 = 仓库相对路径去掉开头的 public
  const segs = rel.split(path.sep);
  if (segs[0] !== "public") warns.push(`${rel} 不在 public/ 下，静态站点里访问不到`);
  const url = "/" + segs.slice(1).join("/");

  const r = meta.width / meta.height;
  sum += r;
  const kb = readFileSync(abs).length / 1024;
  if (meta.format === "png") warns.push(`${file} 是 png（${kb.toFixed(0)} KB），转成 webp 能小一个量级`);
  else if (kb > 400) warns.push(`${file} 有 ${kb.toFixed(0)} KB，偏大`);

  items.push({ url, caption, r, w: meta.width, h: meta.height, kb });
}

if (missing.length) {
  console.error("读不到这些图（文件名或路径不对）：");
  for (const m of missing) console.error("  " + m);
  const abs = path.resolve(ROOT, dir);
  try {
    console.error(`\n${path.relative(ROOT, abs)}/ 里现有：`);
    console.error("  " + readdirSync(abs).sort().join("  "));
  } catch {
    console.error(`\n${path.relative(ROOT, abs)}/ 这个目录也不存在`);
  }
  process.exit(1);
}

const w = Math.max(...items.map((i) => i.url.length));
for (const i of items) {
  console.error(
    `  ${i.url.padEnd(w)}  ${String(i.w).padStart(5)}x${String(i.h).padEnd(5)}  宽/高=${i.r.toFixed(3)}  ${i.kb.toFixed(0).padStart(4)} KB`
  );
}
console.error(
  items.length === 1
    ? `  单张按原尺寸 ${items[0].w}x${items[0].h} 居中（超过 750px 宽才缩）`
    : `  Σ(宽/高) = ${sum.toFixed(3)}   在 750px 栏宽下高度 ≈ ${((750 - 16 * (items.length - 1)) / sum).toFixed(0)}px`
);
for (const m of warns) console.error("  提醒：" + m);
console.error("");

// 注意：markdown 里 HTML 块遇到空行就结束，所以这里一行空行都不能有
const pad = "  ";
const lines = ['<div class="duo">'];
for (const i of items) {
  lines.push(`${pad}<div style="--r:${i.r.toFixed(3)}">`);
  lines.push(`${pad}${pad}<img src="${i.url}">`);
  if (cap && i.caption) lines.push(`${pad}${pad}<div>${esc(i.caption)}</div>`);
  lines.push(`${pad}</div>`);
}
lines.push("</div>");
console.log(lines.join("\n"));
