# 从手机截图中裁出面包小人素材（去掉播放器 UI 黑边），输出到 miniprogram/assets/mascot/
# 用法：python scripts/build-mascot-assets.py "截图所在目录"
# 截图原始尺寸 1206x2622，裁剪框坐标均为原图像素 (left, top, w, h)
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'screenshots')
DST = Path(__file__).resolve().parent.parent / 'miniprogram' / 'assets' / 'mascot'

JOBS = [
    # (源文件, 裁剪框, 输出名, 目标宽)
    ('d05abf5957d335027a87ec3ce0689de3.jpg', (43, 853, 1110, 1110), 'happy.jpg', 560),   # 白底大脸
    ('beb9a55adf8b3e987547b78a9d46f8a5.jpg', (59, 858, 1028, 918), 'cheer.jpg', 680),     # 披风飞翔（避开底部 logo 文字）
    ('262075cc443cb6565e1c479e199e56ac.jpg', (249, 1041, 734, 734), 'rest.jpg', 640),     # 坐火车发呆
]

def main():
    DST.mkdir(parents=True, exist_ok=True)
    for name, (x, y, w, h), out, target_w in JOBS:
        img = Image.open(SRC / name)
        crop = img.crop((x, y, x + w, y + h))
        if crop.width > target_w:
            crop = crop.resize((target_w, round(crop.height * target_w / crop.width)), Image.LANCZOS)
        path = DST / out
        crop.save(path, 'JPEG', quality=88)
        print(f'{out}: {crop.size} {path.stat().st_size // 1024}KB')

if __name__ == '__main__':
    main()
