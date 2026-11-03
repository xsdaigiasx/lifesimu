"""Exact lossless crops; never resizes a source. Strict native target by default."""
from pathlib import Path
from PIL import Image
import argparse,json,hashlib,shutil
p=argparse.ArgumentParser();p.add_argument('--source',default='art/map-source/master-original.webp');p.add_argument('--allow-low-resolution-fallback',action='store_true');p.add_argument('--native-detail-reviewed',action='store_true',help='Explicit human review of source provenance and100% detail crops; dimensions alone cannot prove native detail.');a=p.parse_args()
src=Path(a.source);im=Image.open(src).convert('RGB');w,h=im.size;native=(w,h)==(3840,2560)
if not native and not a.allow_low_resolution_fallback:raise SystemExit(f'REJECTED: source is {w}x{h}, required3840x2560. No upscaling performed.')
if native and not a.native_detail_reviewed:raise SystemExit('3840x2560 dimensions found; inspect provenance and100% details, then explicitly pass --native-detail-reviewed. Dimensions alone do not prove native detail.')
if w%4 or h%4 or w*2!=h*3:raise SystemExit('Source must be 3:2 and exactly divisible into4x4.')
archived=Path('art/map-source')/('master-original'+src.suffix.lower());archived.parent.mkdir(parents=True,exist_ok=True)
if archived.resolve()!=src.resolve():shutil.copyfile(src,archived)
out=Path('public/assets/map-tiles');out.mkdir(parents=True,exist_ok=True);tw,th=w//4,h//4;tiles=[]
for row in range(4):
 for col in range(4):
  key=f'r{row}-c{col}';box=(col*tw,row*th,(col+1)*tw,(row+1)*th);crop=im.crop(box);path=out/(key+'.webp');temp=path.with_suffix('.tmp');crop.save(temp,'WEBP',lossless=True,method=6);temp.replace(path)
  decoded=Image.open(path).convert('RGB');assert decoded.tobytes()==crop.tobytes()
  tiles.append(dict(id=key,row=row,column=col,url='assets/map-tiles/'+path.name+'?v='+hashlib.sha256(path.read_bytes()).hexdigest()[:12],width=tw,height=th,box=list(box),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
manifest=dict(version=1,source=dict(width=w,height=h,sha256=hashlib.sha256(src.read_bytes()).hexdigest(),file=archived.as_posix(),nativeTargetMet=native and a.native_detail_reviewed,nativeDetailReviewed=bool(native and a.native_detail_reviewed),noUpscaling=True),target=dict(width=3840,height=2560,tileWidth=960,tileHeight=640),display=dict(width=1440,height=960),columns=4,rows=4,tiles=tiles)
Path('src/map/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));Path('public/assets/map-tiles/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
Path('art/map-quality').mkdir(exist_ok=True,parents=True);im.crop((max(0,w//5-160),max(0,h*2//3-160),min(w,w//5+160),min(h,h*2//3+160))).save('art/map-quality/source-detail-100percent.png')
print(json.dumps({'source':[w,h],'tiles':16,'tileSize':[tw,th],'nativeTargetMet':native,'losslessPixelMatch':True,'resized':False}))
