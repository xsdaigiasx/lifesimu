from pathlib import Path
import json,math
plan=json.loads(Path('src/map/city-plan.json').read_text());assets={a['id']:a for a in json.loads(Path('src/map/city-assets.json').read_text())}
def point(s,t):
 q=1-t;return tuple(q**3*s[0][i]+3*q*q*t*s[1][i]+3*q*t*t*s[2][i]+t**3*s[3][i] for i in (0,1))
roads=[(r['id'],r['width']/2+4,[point(s,i/80) for s in r['segments'] for i in range(81)]) for r in plan['roads']]
def distance(p,a,b):
 dx=b[0]-a[0];dy=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy or 1)));return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def cross(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def inside(p,poly):return all(cross(poly[i],poly[(i+1)%4],p)>=0 for i in range(4)) or all(cross(poly[i],poly[(i+1)%4],p)<=0 for i in range(4))
def measure(lot):
 a=assets[lot.get('asset',lot.get('id'))];width=a['projection']['renderWidth']*lot.get('scale',.92 if lot.get('id')=='apartments' else 1)
 v=a['projection']['footprint'];poly=[(lot['x']+v[i][0]*width,lot['y']+v[i][1]*width) for i in [0,2,1,3]]
 clearance=1e6;nearest=''
 for name,radius,points in roads:
  if any(inside(p,poly) for p in points):gap=-radius
  else:
   gap=min(min(distance(poly[k],points[j],points[j+1]) for k in range(4)) for j in range(len(points)-1))-radius
   gap=min(gap,min(distance(p,poly[k],poly[(k+1)%4]) for p in points for k in range(4))-radius)
  if gap<clearance:clearance=gap;nearest=name
 return clearance,nearest
if __name__=='__main__':
 for lot in plan['plots']+plan['fills']:
  gap,road=measure(lot);print(lot.get('id',lot.get('key')),round(gap,1),road)
