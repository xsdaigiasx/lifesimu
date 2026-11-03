from pathlib import Path
from PIL import Image,ImageChops,ImageStat
import json,hashlib
m=json.loads(Path('src/map/manifest.json').read_text());src=Image.open(m['source']['file']).convert('RGB')
assert src.size==(6144,4096)
assert hashlib.sha256(Path(m['source']['file']).read_bytes()).hexdigest()==m['source']['sha256']
assert len(m['tiles'])==16
report=[]
for t in m['tiles']:
 p=Path('public')/t['url'].split('?')[0];im=Image.open(p).convert('RGB');assert im.size==(1536,1024)==(t['width'],t['height'])
 assert hashlib.sha256(p.read_bytes()).hexdigest()==t['sha256']
 assert t['box']==[t['column']*1536,t['row']*1024,(t['column']+1)*1536,(t['row']+1)*1024]
 delta=ImageStat.Stat(ImageChops.difference(im,src.crop(t['box']))).mean;assert max(delta)<6
 report.append(dict(id=t['id'],bytes=p.stat().st_size,meanChannelError=delta))
result=dict(sourceSize=list(src.size),tileCount=16,resizedDuringPreparation=False,sourcePixelsPerCssAtMaxZoom=1536/(360*1.15),runtimeBytes=sum(t['bytes'] for t in report),tiles=report)
Path('art/map-source/upscale-verification.json').write_text(json.dumps(result,indent=2)+'\n');print({k:v for k,v in result.items() if k!='tiles'})
