"""Measure visible parcel edges; normalize each sprite's ground plane to the road axes.
Pixel data is unchanged. The renderer applies these affine placement parameters.
"""
from PIL import Image
from pathlib import Path
import numpy as np,json,math
path=Path('src/map/city-assets.json');assets=json.loads(path.read_text())
for asset in assets:
 alpha=np.array(Image.open(Path('public')/asset['url'].split('?')[0]).getchannel('A'));h,w=alpha.shape
 bottom=np.where(alpha>210,np.indices(alpha.shape)[0],-1).max(axis=0)
 left=np.arange(int(w*.15),int(w*.4));right=np.arange(int(w*.6),int(w*.85))
 ml,bl=np.polyfit(left,bottom[left],1);mr,br=np.polyfit(right,bottom[right],1)
 assert ml>0 and mr<0
 apexX=(br-bl)/(ml-mr);apexY=ml*apexX+bl
 l=np.array([0.,bl]);r=np.array([w-1.,mr*(w-1)+br]);front=np.array([apexX,apexY]);back=l+r-front;center=(l+r)/2
 d=(85/180)/((ml-mr)/2);b=-(ml+mr)/2*d
 vertices=[]
 for x,y in [l,r,front,back]:
  dx=(x-center[0])/w;dy=b*dx+d*(y-center[1])/h;vertices.append([float(dx),float(dy)])
 metric=max(max(abs(x/180+y/85),abs(x/180-y/85)) for x,y in vertices)
 renderWidth=min(240,math.floor(.68/metric))
 clearance=(1-metric*renderWidth)/math.hypot(1/180,1/85)-17
 assert clearance>=7
 asset['projection']={'anchorX':float(center[0]/w),'anchorY':float(center[1]/h),'shearY':float(b),'scaleY':float(d),'renderWidth':renderWidth,'footprint':vertices,'curbClearance':float(clearance)}
 print(asset['id'],renderWidth,round(clearance,1),'px from curb')
path.write_text(json.dumps(assets,indent=2)+'\n')
