# 从手机截图中裁出面包小人素材并抠掉背景，输出到 miniprogram/assets/mascot/
# 用法：python scripts/build-mascot-assets.py "截图所在目录"
# 截图原始尺寸 1206x2622，裁剪框坐标均为原图像素 (left, top, w, h)，全部裁成正方形
# 抠图策略：face 类用椭圆 mask（面包脸本身是椭圆）；全身/场景用从边缘洪水填充去背景色
import sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'screenshots')
DST = Path(__file__).resolve().parent.parent / 'miniprogram' / 'assets' / 'mascot'

JOBS = [
    # (源文件, 裁剪框, 输出名, 目标宽, 抠图方式)
    ('d05abf5957d335027a87ec3ce0689de3.jpg', (43, 853, 1110, 1110), 'happy.png', 560, 'ellipse'),  # 白底大脸
    ('beb9a55adf8b3e987547b78a9d46f8a5.jpg', (59, 830, 1028, 1028), 'cheer.png', 680, 'flood'),     # 披风飞翔，黄底
    ('f37e8cfdc725375ba9623d3d14cf8331.jpg', (213, 640, 780, 780), 'wave.png', 480, 'flood'),       # 蓝帽挥手半身，白底
    ('262075cc443cb6565e1c479e199e56ac.jpg', (249, 1041, 734, 734), 'rest.jpg', 640, None),         # 坐火车发呆（保留场景）
    ('f0d49aa2cb2aaba6b9e625957a98b687.jpg', (202, 642, 800, 800), 'hungry.png', 480, 'flood', 2),  # 乖巧微笑大脸（饿着状态），白底，腐蚀 2px 去白晕
    ('2024e5acc0585a59383182b2ccabd698.jpg', (170, 773, 865, 865), 'donut.png', 560, 'flood'),      # 甜甜圈套脸，粉底
]

def color_dist(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))

def ellipse_key(img):
    """面包脸是非白区域构成的椭圆：取内容包围盒内切椭圆作 alpha，略收缩吃掉描边外的 JPEG 光晕"""
    px = img.load()
    w, h = img.size
    xs, ys = [], []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            p = px[x, y]
            if not (p[0] > 245 and p[1] > 245 and p[2] > 245):
                xs.append(x)
                ys.append(y)
    if not xs:
        return img
    box = (max(min(xs) - 4, 0), max(min(ys) - 4, 0), min(max(xs) + 4, w), min(max(ys) + 4, h))
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    return img.convert('RGBA'), mask

def flood_key(img, tol=32):
    """从四边洪水填充与角点背景色相近的像素并置透明，不碰被黑色描边包围的内部区域"""
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    bg = px[3, 3][:3]
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i] or color_dist(px[x, y][:3], bg) > tol:
            continue
        seen[i] = 1
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return img, None

def main():
    DST.mkdir(parents=True, exist_ok=True)
    for name, (x, y, w, h), out, target_w, key, *rest in JOBS:
        img = Image.open(SRC / name).crop((x, y, x + w, y + h))
        if key == 'ellipse':
            img, mask = ellipse_key(img)
            if mask:
                img.putalpha(mask)
        elif key == 'flood':
            img, _ = flood_key(img)
            if rest and rest[0]:
                # 白底图的描边外会残留一圈浅灰晕，腐蚀 alpha 通道吃掉它
                img.putalpha(img.getchannel('A').filter(ImageFilter.MinFilter(rest[0] * 2 + 1)))
        if img.width > target_w:
            img = img.resize((target_w, round(img.height * target_w / img.width)), Image.LANCZOS)
        path = DST / out
        if out.endswith('.png'):
            img.save(path, 'PNG', optimize=True)
        else:
            img.convert('RGB').save(path, 'JPEG', quality=88)
        print(f'{out}: {img.size} {path.stat().st_size // 1024}KB')

if __name__ == '__main__':
    main()
