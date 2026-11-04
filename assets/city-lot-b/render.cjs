// Original native architectural illustration, exact 2:1 geometry, AI material washes only.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'app/public/assets/city/buildings'),ink='#4a3b33';
const C={cream:'#fbf3e2',wood:'#d9a066',sage:'#9cc28a',teal:'#7fb8b0',pink:'#f2b8c6',butter:'#f4d58d',blue:'#a9c4e4',brick:'#d98276',glass:'#bddee0',darkglass:'#81b4b8',roof:'#c77e6f'};
const defs=[
 {id:'home',name:'Khu nhà trọ',w:4,h:4,z:330},
 {id:'office',name:'Văn phòng sáu công ty',w:6,h:6,z:650},
 {id:'market',name:'Chợ dân sinh',w:6,h:6,z:280},
 {id:'mall',name:'Trung tâm thương mại',w:6,h:6,z:440},
 {id:'bank',name:'Ngân hàng',w:4,h:4,z:280},
 {id:'hospital',name:'Bệnh viện',w:6,h:6,z:480},
 {id:'bus',name:'Trạm xe buýt',w:2,h:4,z:220},
 {id:'park',name:'Công viên',w:8,h:8,z:300},
 {id:'streetfood',name:'Quán ăn ven đường',w:4,h:4,z:230},
 {id:'restaurant',name:'Nhà hàng',w:4,h:4,z:360},
 {id:'apartments',name:'Dãy nhà phố',w:6,h:4,z:360},
 {id:'villa',name:'Biệt thự',w:6,h:6,z:420},
 {id:'park-gazebo',name:'Chòi nghỉ công viên',w:3,h:3,z:290,component:true},
 {id:'park-fountain',name:'Đài phun nước',w:3,h:3,z:150,component:true}
];
class Scene{
 constructor(d){this.d=d;this.width=(d.w+d.h)*128;this.height=(d.w+d.h)*64+d.z;this.origin=[d.h*128,d.z];this.parts=[];this.points=[]}
 P(x,y,z=0){this.points.push([x,y,z]);return [this.origin[0]+(x-y)*128,this.origin[1]+(x+y)*64-z]}
 pts(a){return a.map(p=>this.P(...p).map(n=>+n.toFixed(3)).join(',')).join(' ')}
 poly(a,c,sw=2,extra=''){this.parts.push(`<polygon points="${this.pts(a)}" fill="${c}" stroke="${sw?ink:'none'}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`)}
 wash(a,c,material='plaster',sw=2){this.poly(a,c,sw);this.poly(a,'url(#'+material+')',0,'opacity=".13"')}
 line(a,c=ink,sw=2){this.parts.push(`<polyline points="${this.pts(a)}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`)}
 box(x,y,w,h,z,t,top=C.cream,left='#eedcc4',right='#dec8aa',wash=false){const a=[[x+w,y,z],[x+w,y+h,z],[x+w,y+h,z+t],[x+w,y,z+t]],b=[[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+t],[x,y+h,z+t]],c=[[x,y,z+t],[x+w,y,z+t],[x+w,y+h,z+t],[x,y+h,z+t]];for(const [p,k]of[[a,right],[b,left],[c,top]])wash?this.wash(p,k):this.poly(p,k)}
 ellipse(x,y,z,rx,ry,c,sw=2){let a=[];for(let i=0;i<40;i++){let t=i*Math.PI/20;a.push([x+rx*Math.cos(t),y+ry*Math.sin(t),z])}this.poly(a,c,sw)}
 face(axis,at,from,w,z,h,c,sw=1.8){const p=(t,z)=>axis==='y'?[t,at,z]:[at,t,z];this.poly([p(from,z),p(from+w,z),p(from+w,z+h),p(from,z+h)],c,sw)}
 win(axis,at,from,w,z,h,open=false){this.face(axis,at,from,w,z,h,C.wood,2);this.face(axis,at+.003,from+.035,w-.07,z+5,h-10,open?'#75999b':C.glass,1);const p=(t,z)=>axis==='y'?[t,at+.006,z]:[at+.006,t,z];this.line([p(from+w/2,z+5),p(from+w/2,z+h-5)],'#ac906c',2);this.line([p(from+.04,z+h*.42),p(from+w-.04,z+h*.42)],'#eee7c9',1.6);this.line([p(from+.12,z+h-12),p(from+w*.38,z+h-12)],'#e6f2e7',2)}
 door(axis,at,from,w,z=12,h=105,c=C.teal){this.face(axis,at,from,w,z,h,c,2.2);const p=(t,z)=>axis==='y'?[t,at+.006,z]:[at+.006,t,z];this.line([p(from+w*.55,z+8),p(from+w*.55,z+h-8)],'#d8e5d4',1.8);this.line([p(from+w*.68,z+h*.45),p(from+w*.68,z+h*.55)],C.butter,3)}
 roof(x,y,w,h,z,rise,c=C.brick){
  this.poly([[x,y,z],[x+w,y,z],[x+w,y+h/2,z+rise],[x,y+h/2,z+rise]],'#e3a38b');
  this.poly([[x+w,y,z],[x+w,y+h,z],[x+w,y+h/2,z+rise]],'#b77468');
  this.wash([[x,y+h,z],[x+w,y+h,z],[x+w,y+h/2,z+rise],[x,y+h/2,z+rise]],c,'plaster',2.5);
  for(let i=1;i<Math.ceil(w/.25);i++){let t=x+i*w/Math.ceil(w/.25);this.line([[t,y+h,z+1],[t,y+h/2,z+rise+1]],'#ad6f63',1)}
  for(let i=1;i<5;i++){let t=i/5;this.line([[x,y+h-(h/2)*t,z+rise*t+1],[x+w,y+h-(h/2)*t,z+rise*t+1]],'#edb39a',1.4)}
  this.line([[x,y+h/2,z+rise+2],[x+w,y+h/2,z+rise+2]],'#9f6a5c',3);
 }
 hip(x,y,w,h,z,rise,c=C.teal){let cx=x+w/2,cy=y+h/2;this.poly([[x,y,z],[x+w,y,z],[cx,cy,z+rise]],'#a5c8b5');this.poly([[x+w,y,z],[x+w,y+h,z],[cx,cy,z+rise]],'#6b9f99');this.poly([[x,y+h,z],[x+w,y+h,z],[cx,cy,z+rise]],c);this.poly([[x,y,z],[x,y+h,z],[cx,cy,z+rise]],'#b4d4be');for(let i=1;i<6;i++){let t=i/6;this.line([[x+w*t,y+h,z],[cx,cy,z+rise]],'#65958c',1)}}
 rail(axis,at,from,w,z,h=38,c='#889c89'){const p=(t,z)=>axis==='y'?[t,at,z]:[at,t,z];this.line([p(from,z+h),p(from+w,z+h)],c,3);for(let t=from;t<=from+w+.001;t+=.19)this.line([p(t,z),p(t,z+h)],c,2)}
 plant(x,y,z=6,r=.25){this.box(x-r*.5,y-r*.5,r,r,z,22,'#dba883','#cc9674','#be8e69');this.line([[x,y,z+22],[x,y,z+70]],'#8c9c68',3);for(const [dx,dy,dz]of[[-.12,0,48],[.13,0,60],[0,.12,70],[0,-.09,52]])this.ellipse(x+dx,y+dy,z+dz,r*.85,r*.65,C.sage,1.4)}
 tree(x,y,z=6,r=.45){this.box(x-.06,y-.06,.12,.12,z,80,'#d9a066','#ba8a62','#a47e59');this.ellipse(x,y,z+78,r,r,'#83ab78');this.ellipse(x-.1,y+.05,z+109,r*.88,r*.8,'#a4c890');this.ellipse(x+.1,y-.06,z+133,r*.61,r*.65,'#b1ce99');this.line([[x-.15,y+.08,z+113],[x-.03,y+.14,z+118]],'#7d9e70',1.4)}
 slab(){this.box(.035,.035,this.d.w-.07,this.d.h-.07,-1,1,'#e7dfce','#d2c6ae','#c2b89e',true)}
 table(x,y,r=.25,c=C.blue){this.box(x-.03,y-.03,.06,.06,6,46,c,c,c);this.ellipse(x,y,54,r,r,c)}
 stool(x,y,c=C.blue){for(const [dx,dy]of[[0,0],[.15,0],[0,.15],[.15,.15]])this.box(x+dx,y+dy,.025,.025,8,25,c,c,c);this.box(x-.025,y-.025,.23,.23,33,5,c,c,c)}
 umbrella(x,y,r=.85,c=C.pink){this.box(x-.025,y-.025,.05,.05,5,152,C.cream,'#b3aea0','#aaa698');let n=8;for(let i=0;i<n;i++){let a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;this.poly([[x,y,183],[x+Math.cos(a)*r,y+Math.sin(a)*r,145],[x+Math.cos(b)*r,y+Math.sin(b)*r,145]],i%2?C.cream:c,1.5)}}
 gazebo(x,y,w=2.6,h=2.6){this.box(x,y,w,h,0,10,'#e9d9bd','#d1b895','#c4aa86');this.box(x+.12,y+h-.33,w-.24,.24,42,12,C.wood);for(const [a,b]of[[x+.12,y+.12],[x+w-.26,y+.12],[x+.12,y+h-.26],[x+w-.26,y+h-.26]])this.box(a,b,.14,.14,10,144,C.wood,'#c59266','#b4805b');this.hip(x-.02,y-.02,w+.04,h+.04,165,85);this.rail('y',y+h-.10,x+.2,w-.4,12,44);this.rail('x',x+w-.10,y+.2,h-.4,12,44)}
 fountain(x,y,r=1.1){this.ellipse(x,y,6,r,r,'#d1cfc0');this.ellipse(x,y,19,r,r,'#ebdfc5');this.ellipse(x,y,22,r-.12,r-.12,'#91c5c5');this.ellipse(x,y,25,r-.22,r-.22,'#a8d3d1');this.box(x-.07,y-.07,.14,.14,24,54,C.cream,'#d7c7ae','#c6bda9');this.ellipse(x,y,67,r*.46,r*.46,'#e7dcc3');this.ellipse(x,y,72,r*.37,r*.37,'#a8d3d1');this.box(x-.035,y-.035,.07,.07,73,31,C.cream);this.ellipse(x,y,105,.12,.12,'#a8d3d1');for(const [dx,dy]of[[.55,0],[-.55,0],[0,.55],[0,-.55]]){let a=[];for(let i=0;i<=16;i++){let t=i/16;a.push([x+dx*t,y+dy*t,95*(1-t)+25*t+34*Math.sin(t*Math.PI)])}this.line(a,'#badfda',3)}}
 svg(debug=false){const t=fs.readFileSync(path.join(__dirname,'materials/plaster.png')).toString('base64');let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}"><defs><pattern id="plaster" patternUnits="userSpaceOnUse" width="256" height="256"><image href="data:image/png;base64,${t}" width="256" height="256"/></pattern></defs>${this.parts.join('')}`;if(debug){for(let x=0;x<=this.d.w;x++)out+=`<polyline points="${this.pts([[x,0],[x,this.d.h]])}" stroke="#c46945" stroke-width="2"/>`;for(let y=0;y<=this.d.h;y++)out+=`<polyline points="${this.pts([[0,y],[this.d.w,y]])}" stroke="#c46945" stroke-width="2"/>`}return out+'</svg>'}
}
function draw(d){const s=new Scene(d),B=(...a)=>s.box(...a);if(!d.id.startsWith('park'))s.slab();
 if(d.id==='home'){
  B(.18,.18,1.28,3.55,0,230,C.butter,'#ead5ae','#d6c09e',true);B(1.48,.18,2.32,1.10,0,230,C.cream,'#edcfb5','#d8b89f',true);
  s.roof(.12,.12,1.4,3.65,230,58);s.roof(1.48,.12,2.36,1.2,230,50);
  for(const z of [22,137]){s.door('x',1.465,.5,.53,z,80);s.win('x',1.47,1.6,.60,z+12,64);s.win('x',1.47,2.6,.60,z+12,64);s.win('y',1.285,2.25,.62,z+12,64)}
  B(1.45,1.30,2.3,.25,117,8,C.cream);s.rail('y',1.53,1.54,2.1,125,34);s.rail('x',1.70,1.65,1.9,125,34);B(1.47,1.57,.3,2.05,117,8,C.cream);
  for(let i=0;i<8;i++)B(2.65+i*.125,1.65,.125,.65,0,(i+1)*14,C.cream,'#dfcfb7','#cbb99e');
  s.line([[1.82,1.67,185],[3.6,1.67,185]],'#a89472',1.5);for(let i=0;i<4;i++)s.face('y',1.67,1.95+i*.36,.24,157,24,[C.pink,C.blue,C.butter,C.sage][i],1);
  s.plant(3.45,3.50);s.plant(.55,3.50);
 }else if(d.id==='office'){
  B(.55,.6,4.9,4.85,0,526,'#e6dfca','#e7e1d0','#cccfc5',true);
  for(let floor=0;floor<6;floor++){let z=27+floor*80;for(let t=.83;t<5.1;t+=.72){s.win('y',5.455,t,.54,z,56);s.win('x',5.455,t,.54,z,56)}B(.54,.59,4.92,4.87,z+65,9,C.cream,'#e8d9be','#c4c6b5')}
  s.door('y',5.465,2.15,1.35,9,101,C.darkglass);B(1.86,5.40,1.94,.44,118,12,C.teal,'#9dc8b4','#719c94');B(1.08,1.15,2.1,1.7,526,62,C.cream,'#dcd8c7','#c8ccbf');
  for(let x=1.2;x<2.9;x+=.30)s.line([[x,1.22,591],[x,2.72,591]],'#b5bbaa',1);
  s.plant(.35,5.40,5,.23);s.plant(5.56,5.40,5,.23);
 }else if(d.id==='market'){
  // A corrugated roof and open stalls, with recognizable produce silhouettes.
  for(const [x,y]of[[.45,.6],[5.45,.6],[.45,3.3],[5.45,3.3]])B(x,y,.10,.10,0,172,C.wood,'#b98c66','#aa805f');
  s.roof(.25,.3,5.5,3.5,174,72,'#9caeae');
  const colors=[C.sage,C.butter,C.brick,C.teal];for(let i=0;i<4;i++){let x=.44+i*1.32;B(x,3.37,1.12,1.12,0,57,colors[i],'#d5bb8f','#bfaa87',true);B(x-.03,3.34,1.18,1.18,57,8,C.cream);for(let j=0;j<4;j++)for(let k=0;k<2;k++)s.ellipse(x+.16+j*.24,3.65+k*.4,70,.09,.12,[C.sage,C.brick,C.butter,'#acd0d4'][i],1);}
  for(let i=0;i<8;i++){let x=.30+i*.68;s.poly([[x,3.53,175],[x+.68,3.53,175],[x+.68,4.18,130],[x,4.18,130]],i%2?C.cream:C.brick,1.5)}
  for(const [x,y]of[[.65,5.1],[2.1,5.1],[4.75,5.1]])B(x,y,.68,.60,0,35,C.wood,'#cf9d6d','#bc8d63');
 }else if(d.id==='mall'){
  B(.35,.35,5.3,5.2,0,315,C.cream,'#eedcc7','#d8c5b2',true);
  for(let level=0;level<3;level++){let z=20+level*95;for(let x=.65;x<5.2;x+=.82){s.win('y',5.555,x,.66,z,70);s.win('x',5.655,x,.66,z,70)}B(.32,.32,5.36,5.26,z+76,14,[C.butter,C.pink,C.teal][level],'#e6c2a6','#ceaca0')}
  s.door('y',5.56,2.12,1.4,5,110,C.darkglass);B(1.82,5.48,2.0,.34,125,12,C.butter,'#eedcc7','#ccb994');
  B(1.12,1.12,3.7,3.6,315,17,C.teal,'#aad0c0','#79aaa1');B(1.8,1.8,2.3,2.2,332,58,C.glass,'#bedcda','#8cb8b4');
  // Generic shopping bag pictogram, deliberately no text or brand.
  s.face('y',5.57,.72,.63,235,41,C.cream);s.line([[.88,5.58,276],[.88,5.58,287],[1.15,5.58,287],[1.15,5.58,276]],C.wood,3);
  s.plant(.5,5.5,4,.25);s.plant(5.4,5.5,4,.25);
 }else if(d.id==='bank'){
  B(.32,.35,3.35,3.18,0,172,C.butter,'#f1e2c9','#dbceb6',true);s.door('y',3.54,1.46,1.08,4,116,C.darkglass);
  for(const x of [.55,1.03,2.86,3.34]){B(x,3.42,.20,.27,5,140,C.cream,'#e9dcc7','#cdbfa8');B(x-.04,3.38,.28,.35,145,12,C.cream)}
  B(.25,3.32,3.5,.46,160,14,C.cream);s.poly([[.20,3.82,174],[3.80,3.82,174],[2,3.82,244]],C.butter,2.5);
  s.face('y',3.84,1.71,.58,182,32,C.cream,1.7);s.line([[1.84,3.85,194],[2.14,3.85,194]],C.wood,3);
  B(.4,.4,3.2,2.6,172,20,C.cream);s.plant(.28,3.62,6,.18);s.plant(3.65,3.62,6,.18);
 }else if(d.id==='hospital'){
  B(.45,.55,5.1,4.9,0,348,C.cream,'#e4eddf','#cadcd3',true);
  for(let z=47;z<320;z+=90)for(let x=.72;x<5.2;x+=.78){s.win('y',5.455,x,.55,z,54);s.win('x',5.555,x,.55,z,54)}
  B(1.75,1.8,2.4,2.2,348,72,C.teal,'#a8cdbd','#79aba3');B(1.70,1.75,2.5,2.3,420,10,C.cream);
  s.door('y',5.47,2.14,1.35,4,100,C.darkglass);B(1.82,5.35,1.99,.45,116,14,C.teal,'#acd0bf','#82b0a4');
  s.face('y',5.48,2.6,.32,260,64,C.teal,0);s.face('y',5.49,2.36,.80,281,22,C.teal,0);
  B(.65,.6,4.7,4.5,348,14,C.cream);s.plant(.65,5.17,7,.25);s.plant(5.3,5.17,7,.25);
 }else if(d.id==='bus'){
  B(.30,.45,1.38,2.7,0,17,C.cream);for(const y of [.55,2.90])for(const x of [.40,1.46])B(x,y,.07,.07,17,140,C.teal,'#689b93','#5e8b85');
  s.face('x',.4,.64,2.2,31,111,'#c3dfe0');s.face('y',.56,.5,.9,31,110,'#c8e1df');
  B(.33,.39,1.38,2.8,163,18,C.teal,'#9bc3af','#76a298');B(.50,.8,.37,1.8,44,12,C.wood);for(const y of [.85,2.3])B(.54,y,.11,.11,17,27,C.wood);
  B(1.57,3.47,.07,.07,0,130,C.teal);s.face('y',3.54,1.25,.47,109,45,C.butter);s.face('y',3.55,1.34,.27,118,20,C.blue,1);
 }else if(d.id==='park'||d.id==='park-gazebo'||d.id==='park-fountain'){
  if(d.id==='park'){
   s.gazebo(.20,.20,2.6,2.6);s.fountain(5.5,5.5,1.1);
  }else if(d.id==='park-gazebo')s.gazebo(.20,.20,2.6,2.6);else s.fountain(1.5,1.5,1.1);
 }else if(d.id==='streetfood'){
  B(.25,.4,2.2,1.1,0,79,C.cream,'#ebc99e','#c8ad8c',true);B(.2,.35,2.3,1.2,79,10,C.wood);s.ellipse(.65,.8,92,.30,.24,'#c2cdc2');s.ellipse(1.3,.75,92,.28,.21,'#d4d9ca');
  for(const [x,y]of[[1,2.4],[2.8,2.6]]){s.table(x,y,.40,C.blue);s.stool(x-.62,y-.15,C.blue);s.stool(x+.43,y+.2,C.blue)}
  s.umbrella(2.25,1.25,1.1,C.pink);
 }else if(d.id==='restaurant'){
  B(.5,.45,3.05,2.85,0,217,C.butter,'#f0dac0','#d6bfa8',true);s.roof(.4,.35,3.25,3.05,217,84);
  for(const x of [.73,2.6])s.win('y',3.31,x,.63,133,55);s.door('y',3.32,1.52,.86,4,107,'#8eae9c');
  for(let i=0;i<8;i++){let x=.5+i*.38;s.poly([[x,3.30,130],[x+.38,3.30,130],[x+.38,3.75,102],[x,3.75,102]],i%2?C.cream:C.brick,1.3)}
  s.win('x',3.56,.85,.64,133,55);s.win('x',3.56,2.02,.64,133,55);s.plant(.40,3.40);s.plant(3.60,3.40);
 }else if(d.id==='apartments'){
  const palette=[[C.butter,'#efd8b1'],[C.pink,'#e2bfc0'],[C.teal,'#bed5bd']];for(let i=0;i<3;i++){let x=.14+i*1.93;B(x,.40,1.80,2.95,0,230,palette[i][0],palette[i][1],'#c9bca7',true);s.door('y',3.36,x+.50,.70,5,92);s.win('y',3.37,x+.40,.90,141,65);B(x+.20,3.30,1.35,.38,132,9,C.cream);s.rail('y',3.65,x+.25,1.25,143,31);s.roof(x-.05,.35,1.90,3.05,230,70,[C.brick,'#a2b8ba','#cfaa81'][i])}s.win('x',5.81,1.05,.70,138,66);s.win('x',5.81,2.1,.70,138,66);
 }else if(d.id==='villa'){
  // Garden stays strictly within the 6x6 plot; the pool is part of the property.
  s.poly([[.18,.18],[5.82,.18],[5.82,5.82],[.18,5.82]],'#b1cb98',1.3);
  B(.90,.65,3.70,3.60,0,238,C.cream,'#f0e3cb','#d9d1b7',true);s.roof(.75,.50,4.0,3.9,238,100,'#86aaa9');
  for(const x of [1.2,2.6,3.65])s.win('y',4.26,x,.60,145,62);s.door('y',4.27,2.40,.90,3,117,C.wood);B(1.10,4.23,3.2,.56,128,10,C.cream);s.rail('y',4.76,1.16,3.08,140,32);
  for(const x of [1.16,4.12])B(x,4.46,.13,.13,0,128,C.cream);s.win('x',4.61,1.0,.70,145,62);s.win('x',4.61,2.55,.70,145,62);
  B(3.65,4.96,1.85,.60,0,9,C.cream);s.poly([[3.75,5.04,10],[5.40,5.04,10],[5.40,5.48,10],[3.75,5.48,10]],'#a7d2d2',1.3);
  s.tree(.55,5.30,3,.35);s.tree(5.40,.55,3,.36);s.plant(5.4,3.7,5,.24);
 }
 return s;
}
async function main(){fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});let items=[];
 for(const d of defs){const s=draw(d),svg=s.svg();for(const [x,y,z]of s.points)if(x<0||y<0||x>d.w||y>d.h||z>d.z)throw Error('Geometry exceeds plot/frame '+d.id+' '+[x,y,z]);
  let quality=90,out=await sharp(Buffer.from(svg)).webp({quality,alphaQuality:100,effort:4}).toBuffer();while(out.length>=150000&&quality>65){quality-=5;out=await sharp(Buffer.from(svg)).webp({quality,alphaQuality:100,effort:4}).toBuffer()}if(out.length>=150000)throw Error('Too large '+d.id);
  fs.writeFileSync(path.join(dir,d.id+'.webp'),out);let item={id:d.id,name:d.name,file:'app/public/assets/city/buildings/'+d.id+'.webp',footprint_tiles:[d.w,d.h],frame_px:[s.width,s.height],anchor_px:[d.w*128,s.height],floor_origin_px:s.origin,tile_px:[256,128],z_budget_px:d.z,quality,alphaQuality:100,bytes:out.length,sha256:crypto.createHash('sha256').update(out).digest('hex'),component:!!d.component};
  if(d.id==='park')item.components=[{id:'park-gazebo',world_origin:[0,0]},{id:'park-fountain',world_origin:[4,4]}];items.push(item);
  await sharp(Buffer.from(s.svg(true))).resize({width:600}).flatten({background:'#fbf3e2'}).webp({quality:88}).toFile(path.join(__dirname,'previews',d.id+'-grid.webp'));
  if(!d.component){let file='app/public/assets/locations/'+d.id+'.webp';fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});let card=await sharp(await sharp(out).resize(470,470,{fit:'contain',background:'#00000000'}).png().toBuffer()).extend({top:21,bottom:21,left:21,right:21,background:'#00000000'}).webp({quality:90,alphaQuality:100,effort:4}).toBuffer();fs.writeFileSync(path.join(root,file),card);item.location_card={file,frame_px:[512,512],bytes:card.length,sha256:crypto.createHash('sha256').update(card).digest('hex')};}
  console.log(d.id,s.width+'x'+s.height,out.length);
 }
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:97,lot:'B',projection:'orthographic-2:1',tile_px:[256,128],geometry:'px=128*h+128*(x-y); py=z_budget+64*(x+y)-z; anchor=[128*w,frameHeight]',source:'Original native geometry extended from prior isometric assets; image_gen plaster wash and prior lot4 palette',items},null,2)+'\n');
 const main=items.filter(i=>!i.component),layers=[],cw=460,ch=490;for(let i=0;i<main.length;i++){let x=(i%4)*cw,y=Math.floor(i/4)*ch,b=await sharp(path.join(root,main[i].file)).resize({width:420,height:420,fit:'inside'}).png().toBuffer(),m=await sharp(b).metadata();layers.push({input:b,left:x+(cw-m.width)/2|0,top:y+410-m.height});layers.push({input:Buffer.from(`<svg width="460" height="60"><text x="230" y="30" text-anchor="middle" font-family="DejaVu Sans" font-size="22" fill="${ink}">${main[i].name}</text><text x="230" y="52" text-anchor="middle" font-family="DejaVu Sans" font-size="16" fill="#82725f">${main[i].id} · ${main[i].footprint_tiles.join('×')}</text></svg>`),left:x,top:y+420})}
 await sharp({create:{width:cw*4,height:ch*3,channels:4,background:'#fbf3e2'}}).composite(layers).webp({quality:90}).toFile(path.join(__dirname,'previews/lot-b.webp'));
}
module.exports={Scene,defs,draw,root,dir};if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
