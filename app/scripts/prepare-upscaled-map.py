"""Crop the owner's 6144×4096 upscale without resizing; export 16 native-size WebP tiles."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil
source=Path('art/map-source/city-upscaled-6144.png');source.parent.mkdir(parents=True,exist_ok=True)
if not source.exists():shutil.copyfile('/workspace/scratch/2f3bd6f8f9d6/upscale-review/image-0.png',source)
im=Image.open(source).convert('RGB');assert im.size==(6144,4096)
out=Path('public/assets/map-tiles');out.mkdir(parents=True,exist_ok=True)
tiles=[]
for row in range(4):
 for col in range(4):
  box=[col*1536,row*1024,(col+1)*1536,(row+1)*1024];crop=im.crop(box);p=out/f'r{row}-c{col}.webp';crop.save(p,'WEBP',quality=92,method=6)
  sha=hashlib.sha256(p.read_bytes()).hexdigest();tiles.append(dict(id=f'r{row}-c{col}',row=row,column=col,url=f'assets/map-tiles/{p.name}?v={sha[:12]}',width=crop.width,height=crop.height,box=box,sha256=sha))
manifest=dict(version=2,source=dict(width=6144,height=4096,file=str(source),sha256=hashlib.sha256(source.read_bytes()).hexdigest(),userUpscaled=True,resizedDuringPreparation=False),display=dict(width=1440,height=960),columns=4,rows=4,tiles=tiles)
Path('src/map/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('16 tiles, source preserved; bytes:',sum(p.stat().st_size for p in out.glob('*.webp')))
