#!/usr/bin/env bash
# 生成 Beyond 列表页的整页背景插画（扁平矢量风黄昏夜空）。
# 想改配色/构图就改下面的变量，然后重跑：bash tools/make-bg.sh
# 输出：public/beyond/bg.webp
set -euo pipefail
cd "$(dirname "$0")/.."

W=2400
H=1500
HORIZON=1040                 # 山脊所在的基线（画面上 69% 处）
OUT=public/beyond/bg.webp
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ---------- 配色 ----------
SKY_TOP='#101532'            # 天顶：深靛蓝
SKY_MID='#33304f'            # 中段：夜紫
SKY_HAZE='#8a6a7a'           # 地平线上：暮霭
SKY_LOW='#d8ab8c'            # 地平线：暖沙
GLOW='#f2c9a0'               # 暮光晕
MOON='#f6eeda'
CLOUD='#8d7aa6'
HILL_FAR='#6d5c80'           # 三层山，越近越深
HILL_MID='#4a3f5c'
HILL_NEAR='#2a2340'
SEED=7                       # 星星的位置，改这个数换一片星空

echo "1/6 天空渐变 + 暮光晕"
# 用三段渐变竖直拼接，等价于一条 4 停靠点的渐变。
# 单条 gradient: 只有两个停靠点，暖色会从画面正中间就开始铺，
# 结果中间一大片发土、地平线附近还显出一条硬边。
convert -size ${W}x760  gradient:"$SKY_TOP-$SKY_MID"   "$TMP/sky1.png"
convert -size ${W}x320  gradient:"$SKY_MID-$SKY_HAZE"  "$TMP/sky2.png"
convert -size ${W}x420  gradient:"$SKY_HAZE-$SKY_LOW"  "$TMP/sky3.png"
convert "$TMP/sky1.png" "$TMP/sky2.png" "$TMP/sky3.png" -append "$TMP/sky.png"
# 暮光带单独一层：先画实心条再重模糊，然后把整体透明度压下来，
# 否则 blur 只软化边缘、中间还是不透明的，会把渐变整个盖住。
convert -size ${W}x300 xc:none -fill "$GLOW" -draw "rectangle 0,0 $W,300" \
  -blur 0x55 -channel A -evaluate multiply 0.30 +channel "$TMP/glow.png"
convert "$TMP/sky.png" "$TMP/glow.png" -gravity south -geometry +0+150 \
  -compose over -composite "$TMP/s1.png"

echo "2/6 星星"
# 注意：ImageMagick 的 security policy 禁了 -draw @file，只能把绘制指令当参数传
STARS=$(awk -v W=$W -v hz=$HORIZON -v seed=$SEED 'BEGIN{
  srand(seed); s="";
  for (i = 0; i < 210; i++) {                 # 小星点，越靠地平线越稀
    x = int(rand()*W); y = int(rand()*hz*0.60);
    r = (rand() < 0.86) ? 1 : 2;
    s = s sprintf("circle %d,%d %d,%d ", x, y, x+r, y);
  }
  for (i = 0; i < 7; i++) {                   # 几颗大一点的十字星
    x = int(rand()*W); y = int(rand()*hz*0.45); r = 6 + int(rand()*5);
    s = s sprintf("polygon %d,%d %d,%d %d,%d %d,%d ", x, y-r, x+r*0.22, y, x, y+r, x-r*0.22, y);
  }
  print s;
}')
convert -size ${W}x${H} xc:none -fill '#ffffff' -draw "$STARS" \
  -blur 0x0.6 "$TMP/stars.png"

echo "3/6 月亮"
# 月亮只能待在左上这块空区。标题在页面顶部居中，视口一变背景图的裁切位置就变，
# 同一个月亮会扫过不同位置 —— 实测放右上角时，1200 视口下圆盘正好压住标题末尾
# （1861 个像素连成一片不达标）。左上角在 900/1440/1600/1920 都落在文字左侧，
# 1200 和 1024 会被侧边栏毛玻璃盖住（透出来反而好看），窄屏直接裁掉。
convert -size ${W}x${H} xc:none -fill "$GLOW" -draw "circle 620,300 620,135" \
  -blur 0x70 -channel A -evaluate multiply 0.45 +channel "$TMP/halo.png"
convert -size ${W}x${H} xc:none -fill "$MOON" -draw "circle 620,300 620,205" "$TMP/moon.png"

echo "4/6 云带"
convert -size ${W}x${H} xc:none -fill "$CLOUD" \
  -draw "ellipse 430,720 400,52 0,360" \
  -draw "ellipse 1360,840 520,64 0,360" \
  -draw "ellipse 2080,660 330,44 0,360" \
  -draw "ellipse 900,600 260,34 0,360" \
  -blur 0x46 -channel A -evaluate multiply 0.30 +channel "$TMP/clouds.png"

echo "5/6 三层山丘"
# 山脊用两条正弦叠加出起伏，采样成折线多边形；每层基线更低、颜色更深
hill() {
  awk -v W=$W -v H=$H -v base=$1 -v a1=$2 -v a2=$3 -v ph=$4 'BEGIN{
    s = "";
    for (x = 0; x <= W; x += 16) {
      y = base + a1*sin(x/380 + ph) + a2*sin(x/127 + ph*2.3);
      s = s sprintf("%d,%.1f ", x, y);
    }
    printf "%s%d,%d %d,%d", s, W, H, 0, H;
  }'
}
convert "$TMP/s1.png" "$TMP/stars.png" "$TMP/halo.png" "$TMP/moon.png" "$TMP/clouds.png" \
  -compose over -layers merge +repage "$TMP/s2.png"
convert "$TMP/s2.png" \
  -fill "$HILL_FAR"  -draw "polygon $(hill 1030 52 16 0.4)" \
  -fill "$HILL_MID"  -draw "polygon $(hill 1145 74 22 2.1)" \
  -fill "$HILL_NEAR" -draw "polygon $(hill 1300 88 26 4.3)" \
  "$TMP/s3.png"

echo "6/6 颗粒 + 导出 webp"
convert "$TMP/s3.png" -attenuate 0.055 +noise Gaussian -strip -quality 84 "$OUT"
ls -la "$OUT"
identify "$OUT"
