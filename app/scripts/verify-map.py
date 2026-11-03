from PIL import Image,ImageChops
from pathlib import Path
import json,hashlib
m=json.load(open('src/map/manifest.json'));source_path=Path(m['source']['file']);source_path=source_path if source_path.exists() else Path('public/assets')/m['source']['file'];source=Image.open(source_path).convert('RGB');assert source.size==(m['source']['width'],m['source']['height']);assembled=Image.new('RGB',source.size)
assert len(m['tiles'])==16
for t in m['tiles']:
 p=Path('public')/t['url'].split('?')[0];assert hashlib.sha256(p.read_bytes()).hexdigest()==t['sha256'];im=Image.open(p).convert('RGB');assert im.size==(t['width'],t['height']);assert im.tobytes()==source.crop(t['box']).tobytes();assembled.paste(im,(t['box'][0],t['box'][1]))
assert ImageChops.difference(assembled,source).getbbox() is None
report={'tiles':16,'dimensions':source.size,'tileDimensions':[m['tiles'][0]['width'],m['tiles'][0]['height']],'pixelIdenticalReassembly':True,'native3840TargetMet':source.size==(3840,2560),'upscaled':False,'encoding':'WebP lossless','requestedPixelDensity':3840/1440,'actualPixelDensity':source.width/1440}
Path('art/map-quality/verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
