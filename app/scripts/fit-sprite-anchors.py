#!/usr/bin/env python3
"""Canh điểm neo (ax, ay) của ảnh nội thất theo chân thật của ảnh, ghi vào src/domain/furniture-sprites.json.
Ảnh Codex để lề trong suốt dưới chân đồ và nhiều món nhỏ hơn ô chân đế, nên neo ở mép dưới khung làm đồ lơ lửng hoặc lệch. Cách tính:
- Chân đồ là một hình thoi 2:1 thu nhỏ theo tỉ lệ s so với ô chân đế (fw x fh ô, mỗi ô 128x64). Đỉnh dưới của chân ở hàng điểm ảnh đục thấp nhất (y_f).
- Đỉnh trái nằm cao hơn y_f một đoạn fw*32*s, đỉnh phải cao hơn fh*32*s: đo mép trái, phải của ảnh ở hai độ cao đó, suy ra s, lặp vài lần.
- Đặt tâm chân trùng tâm ô chân đế: ax = x_dưới - (fh - fw)*32*(1 - s), ay = y_f + (fw + fh)*16*(1 - s) (s = 1 thì neo chính là đỉnh dưới của chân).
Bỏ qua tranh (treo tường), đèn và cây (đặt lên bàn dùng chung neo, chỉnh riêng). Chạy: python3 scripts/fit-sprite-anchors.py [--write] [--sheet ra.png]
Không có --write thì chỉ in độ lệch. Cần Pillow, numpy."""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..')
JSON = os.path.join(ROOT, 'src/domain/furniture-sprites.json')
SKIP = ('painting', 'lamp', 'plant')

def fit(path, fw, fh):
    a = np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 40
    ys = np.where(a.any(axis=1))[0]; yf = int(ys.max()) + 1
    xs = np.where(a.any(axis=0))[0]; full = (fw + fh) * 64
    s = min(1.0, (xs.max() - xs.min() + 1) / full)
    def edge(y, left):
        y0 = int(max(0, y - 6)); y1 = int(min(a.shape[0], y + 6)); col = np.where(a[y0:y1].any(axis=0))[0]
        return (col.min() if left else col.max() + 1) if len(col) else None
    for _ in range(8):
        l = edge(yf - fw * 32 * s, True); r = edge(yf - fh * 32 * s, False)
        if l is None or r is None or r <= l: break
        s = max(.2, min(1.0, (r - l) / full))
    # đỉnh dưới của chân: x của điểm trái cộng fw*64*s
    l = edge(yf - fw * 32 * s, True)
    sw = min(1.0, (xs.max() - xs.min() + 1) / full)
    # 06/11 (chủ dự án: giường lệch hẳn neo): đồ phủ kín chân đế (giường, thảm) có thành, đầu giường làm mép trái, phải đo sai,
    # s tụt về sàn 0,2 nên neo rơi xuống dưới ảnh cả một ô. Khi s đo được nhỏ hơn nhiều so với bề ngang ảnh thì lấy s theo bề ngang
    # và x đỉnh dưới là giữa các điểm ảnh đục ở hàng thấp nhất (chân trước hoặc mũi thảm).
    if s < .6 * sw:
        low = np.where(a[yf - 3:yf].any(axis=0))[0]
        return yf, sw, float(low.mean())
    return yf, s, (l if l is not None else xs.min()) + fw * 64 * s

def main():
    sp = json.load(open(JSON, encoding='utf-8'))
    out, worst = {}, []
    for k, v in sp.items():
        if k.startswith(SKIP):
            out[k] = v; continue
        yf, sc, bx = fit(os.path.join(ROOT, 'public') + v['f'], v['fw'], v['fh'])
        ax = round(bx - (v['fh'] - v['fw']) * 32 * (1 - sc)); ay = round(yf + (v['fw'] + v['fh']) * 16 * (1 - sc))
        worst.append((abs(ax - v['ax']) + abs(ay - v['ay']), k, v['ax'], v['ay'], ax, ay))
        out[k] = {**v, 'ax': ax, 'ay': ay}
    worst.sort(reverse=True)
    for d, k, ox, oy, nx, ny in worst[:8]: print(f'{k}: ({ox},{oy}) -> ({nx},{ny})')
    print(f'{len(worst)} ảnh được canh, lệch trung bình {sum(w[0] for w in worst) / len(worst):.1f} px')
    if '--write' in sys.argv:
        open(JSON, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
        print('đã ghi', JSON)
    if '--sheet' in sys.argv:
        sheet(out, sys.argv[sys.argv.index('--sheet') + 1])

def sheet(sp, name, tiers=('basic',), items=('bed', 'wardrobe', 'desk', 'table', 'rug', 'fridge', 'tv'), scale=.5):
    """Ảnh ghép tổng: mỗi hàng một món, 4 hướng, vẽ ô chân đế (xanh) đặt tại điểm neo (chấm đỏ) để soi lệch."""
    cw, ch = 360, 320; rows = [(it, t) for t in tiers for it in items]
    im = Image.new('RGB', (int(4 * cw * scale), int(len(rows) * ch * scale)), '#e9eef0'); d = ImageDraw.Draw(im)
    for r, (it, t) in enumerate(rows):
        for c, dr in enumerate('abcd'):
            k = f'{it}-{t}_{dr}'
            if k not in sp: continue
            v = sp[k]; cell = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); cd = ImageDraw.Draw(cell)
            B = (cw // 2, ch - 20); fw, fh = v['fw'], v['fh']
            L = (B[0] - fw * 64, B[1] - fw * 32); R = (B[0] + fh * 64, B[1] - fh * 32); T = (L[0] + fh * 64, L[1] - fh * 32)
            cd.polygon([B, R, T, L], fill=(80, 200, 120, 150), outline=(0, 120, 40, 255))
            spr = Image.open(os.path.join(ROOT, 'public') + v['f']).convert('RGBA')
            cell.alpha_composite(spr, (max(0, cw // 2 - v['ax']), max(0, ch - 20 - v['ay'])))
            cd.ellipse([B[0] - 3, B[1] - 3, B[0] + 3, B[1] + 3], fill=(255, 0, 0, 255))
            cell = cell.resize((int(cw * scale), int(ch * scale)))
            im.paste(cell, (int(c * cw * scale), int(r * ch * scale)), cell); d.text((int(c * cw * scale) + 3, int(r * ch * scale) + 2), k, fill='black')
    im.save(name)

if __name__ == '__main__': main()
