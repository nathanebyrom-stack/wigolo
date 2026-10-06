import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
H = 640
ims = []
for f in files:
    im = Image.open(f).convert('RGB'); im = im.resize((int(im.width * H / im.height), H)); ims.append((f, im))
W = sum(i.width for _, i in ims) + 10 * (len(ims) - 1)
sh = Image.new('RGB', (W, H + 24), 'white'); x = 0; d = ImageDraw.Draw(sh)
for f, im in ims:
    sh.paste(im, (x, 24)); d.text((x + 4, 4), f.split('/')[-1], fill='black'); x += im.width + 10
sh.save(out)
