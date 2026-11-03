"""Deterministic irregular infill, constrained by real street/parcel geometry."""
from pathlib import Path
import json,random,math
from city_road_geometry import measure,assets,inside,distance,cross
plan=json.loads(Path('src/map/city-plan.json').read_text());rng=random.Random(28)
def polygon(lot):
 a=assets[lot.get('asset',lot.get('id'))];width=a['projection']['renderWidth']*lot.get('scale',.92 if lot.get('id')=='apartments' else 1);v=a['projection']['footprint'];return[(lot['x']+v[i][0]*width,lot['y']+v[i][1]*width) for i in [0,2,1,3]]
def gap(a,b):
 if any(inside(p,b) for p in a) or any(inside(p,a) for p in b):return 0
 for i in range(4):
  for j in range(4):
   p,q=a[i],a[(i+1)%4];r,s=b[j],b[(j+1)%4]
   if cross(p,q,r)*cross(p,q,s)<0 and cross(r,s,p)*cross(r,s,q)<0:return 0
 return min([distance(p,b[k],b[(k+1)%4]) for p in a for k in range(4)]+[distance(p,a[k],a[(k+1)%4]) for p in b for k in range(4)])
polys=[polygon(lot) for lot in plan['plots']+plan['fills']]
added=0
for attempt in range(1600):
 if added>=18:break
 asset='home' if rng.random()<.7 else 'streetfood';lot=dict(key=f'neighborhood-{added}',asset=asset,x=round(rng.uniform(110,1300),1),y=round(rng.uniform(210,885),1),scale=round(rng.uniform(.45,.66),3))
 if lot['x']>1160 and lot['y']>670:continue
 p=polygon(lot)
 if any(x<50 or x>1370 or y<150 or y>930 for x,y in p):continue
 if min(gap(p,q) for q in polys)<12:continue
 clearance,_=measure(lot)
 if not 12<clearance<68:continue
 plan['fills'].append(lot);polys.append(p);added+=1
print('Added',added,'small neighborhood clusters')
# Natural tree groups use trunk positions; leafy crowns may overhang gardens.
trees=[]
for attempt in range(500):
 if len(trees)>=20:break
 p=(rng.uniform(90,1340),rng.uniform(230,900))
 if p[0]>1210 and p[1]>650:continue
 if any(inside(p,poly) or min(distance(p,poly[k],poly[(k+1)%4]) for k in range(4))<18 for poly in polys):continue
 if any(math.hypot(p[0]-t['x'],p[1]-t['y'])<70 for t in trees):continue
 from city_road_geometry import roads
 if min(distance(p,points[j],points[j+1])-r for _,r,points in roads for j in range(len(points)-1))<25:continue
 trees.append(dict(x=round(p[0],1),y=round(p[1],1),width=round(rng.uniform(65,100))))
plan['trees']=trees
Path('src/map/city-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
