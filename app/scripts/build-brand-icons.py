"""Tạo logo và icon PWA của Next Day từ ảnh nguồn docs/assets/brand/next-day-source.png.
Chạy: python3 app/scripts/build-brand-icons.py (cần Pillow)."""
import os
from collections import deque
from PIL import Image, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__));APP=os.path.dirname(HERE)
SRC=os.path.join(APP,'docs/assets/brand/next-day-source.png');OUT=os.path.join(APP,'public/icons')
GREEN=(23,82,57)
im=Image.open(SRC).convert('RGB')
def close(p,c,t=40):return abs(p[0]-c[0])+abs(p[1]-c[1])+abs(p[2]-c[2])<=t
def outer(img,seed=(0,0),t=40):
    """Vùng nền kem nối với góc ảnh (không lấn vào hình bên trong)."""
    w,h=img.size;px=img.load();bg=px[seed];seen=bytearray(w*h);q=deque()
    for x in range(w):
        for y in (0,h-1):q.append((x,y))
    for y in range(h):
        for x in (0,w-1):q.append((x,y))
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=w or y>=h or seen[y*w+x] or not close(px[x,y],bg,t):continue
        seen[y*w+x]=1;q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    m=Image.new('L',(w,h));m.putdata([255 if v else 0 for v in seen]);return m
def bbox_of(img,box,pred):
    x0,y0,x1,y1=box;px=img.load();xs=[];ys=[]
    for y in range(y0,y1):
        for x in range(x0,x1):
            if pred(px[x,y]):xs.append(x);ys.append(y)
    return min(xs),min(ys),max(xs)+1,max(ys)+1
notcream=lambda p:not close(p,(254,247,235),60)
# Logo tròn (nền trong suốt)
lb=bbox_of(im,(0,60,1024,740),notcream);pad=6
logo=im.crop((lb[0]-pad,lb[1]-pad,lb[2]+pad,lb[3]+pad))
from PIL import ImageDraw
S=4;w,h=logo.size;m=Image.new('L',(w*S,h*S),0)
ImageDraw.Draw(m).ellipse((pad*S+3*S,pad*S+3*S,(w-pad)*S-3*S,(h-pad)*S-3*S),fill=255)  # logo là hình elip; nền kem bên trong giữ nguyên
m=m.resize((w,h),Image.LANCZOS)
logo=logo.convert('RGBA');logo.putalpha(m)
logo.thumbnail((512,512),Image.LANCZOS)
logo=logo.quantize(96,method=Image.FASTOCTREE,dither=Image.NONE);logo.save(os.path.join(OUT,'logo.png'),optimize=True)
# Icon ứng dụng (ô vuông bo góc)
ib=bbox_of(im,(0,960,1024,1440),lambda p:close(p,GREEN,50))
side=max(ib[2]-ib[0],ib[3]-ib[1]);inset=4;side-=2*inset;icon=im.crop((ib[0]+inset,ib[1]+inset,ib[0]+inset+side,ib[1]+inset+side))
mask=outer(icon).filter(ImageFilter.MaxFilter(3))
alpha=mask.point(lambda v:255-v)
def rounded(size):
    a=alpha.resize((size,size),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6));i=icon.resize((size,size),Image.LANCZOS).convert('RGBA');i.putalpha(a);return i
def full(size,scale):
    filled=icon.copy();filled.paste(GREEN,mask=mask.filter(ImageFilter.MaxFilter(5)))
    px=filled.load()
    for y in range(filled.height):
        for x in range(filled.width):
            if close(px[x,y],GREEN,36):px[x,y]=GREEN
    base=Image.new('RGB',(size,size),GREEN);s=int(size*scale);base.paste(filled.resize((s,s),Image.LANCZOS),((size-s)//2,(size-s)//2));return base
def save(img,name):
    img=img.quantize(64,dither=Image.NONE) if img.mode=='RGB' else img.quantize(64,method=Image.FASTOCTREE,dither=Image.NONE)
    img.save(os.path.join(OUT,name),optimize=True)
save(rounded(512),'icon-512.png');save(rounded(192),'icon-192.png');save(rounded(32),'favicon-32.png')
save(full(512,.92),'icon-maskable-512.png');save(full(180,1.0),'apple-touch-icon.png')
print('ok',lb,ib)
