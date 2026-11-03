from pathlib import Path
from PIL import Image
import json,hashlib
manifest=json.loads(Path('src/map/city-assets.json').read_text())
generation=json.loads(Path('art/city-rebuild/generation.json').read_text())
assert len(manifest)==12 and len({a['id'] for a in manifest})==12
from city_road_geometry import measure,plan
road_report=[]
for lot in plan['plots']+plan['fills']:
 clearance,road=measure(lot);assert clearance>=8,(lot,clearance,road)
 road_report.append({'id':lot.get('id',lot.get('key')),'clearanceFromCurb':clearance,'nearestRoad':road})
report=[]
for asset in manifest:
 record=next(a for a in generation['assets'] if a['id']==asset['id'])
 source=Image.open(record['source']).convert('RGBA');path=Path('public')/asset['url'].split('?')[0];runtime=Image.open(path).convert('RGBA')
 assert source.size==runtime.size==(asset['width'],asset['height'])
 assert source.getchannel('A').tobytes()==runtime.getchannel('A').tobytes()
 assert runtime.getchannel('A').getextrema()==(0,255)
 assert hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256']
 projection=asset['projection'];width=projection['renderWidth'];ratio=source.width/(width*1.15);assert ratio>=3
 for x,y in projection['footprint']:
  metric=max(abs(x*width/180+y*width/85),abs(x*width/180-y*width/85));assert metric<=.68+1e-8
 assert projection['curbClearance']>=7
 record.update(renderedWidth=width,sourcePixelsPerCssAtMaxZoom=ratio,projection=projection)
 report.append({'id':asset['id'],'size':list(runtime.size),'bytes':path.stat().st_size,'sourcePixelsPerCssAtMaxZoom':ratio,'curbClearance':projection['curbClearance'],'alphaPreserved':True,'upscaled':False})
Path('art/city-rebuild/generation.json').write_text(json.dumps(generation,ensure_ascii=False,indent=2)+'\n')
decor_bytes=0
for decoration in generation.get('decorations',[]):
 source=Image.open(decoration['source']).convert('RGBA');path=Path(decoration['runtime']);runtime=Image.open(path).convert('RGBA');assert source.size==runtime.size;assert source.getchannel('A').tobytes()==runtime.getchannel('A').tobytes();decor_bytes+=path.stat().st_size
result={'activeMap':'irregular street network; layered neighborhoods + 12 independently generated building sources','roadClearance':road_report,'assets':report,'totalRuntimeBytes':sum(a['bytes'] for a in report)+decor_bytes,'maxZoom':1.15,'minSourcePixelsPerCssAtMaxZoom':min(a['sourcePixelsPerCssAtMaxZoom'] for a in report),'upscaled':False}
Path('art/city-rebuild/verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['assets','roadClearance']}))
