// Original vector artwork by Codex. Regenerate with SHARP_MODULE pointing to sharp.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const C = {sage:'#7a7751',leaf:'#8f8663',cream:'#fef0d7',wall:'#eacda4',oak:'#c28448',warm:'#f3b776',metal:'#bdae9c',ink:'#584c44'};
const samples = [[610,450],[966,632],[900,598],[450,350],[601,476],[550,700],[720,480],[627,167]];
const palette = Object.entries(C).map(([name,hex],i)=>({name,hex,sample:samples[i]}));
class Scene {
  constructor(w,h,x,y,rotate=false) { Object.assign(this,{w,h,x,y,rotate}); this.parts=[]; }
  p(x,y,z=0) { if(this.rotate) [x,y]=[y,x]; return [this.w/2-(this.x-this.y)*32+(x-y)*64,this.h-(this.x+this.y)*32+(x+y)*32-z*32]; }
  poly(v,fill,stroke=C.ink,width=1.4) { this.parts.push(`<polygon points="${v.map(p=>this.p(...p).map(n=>+n.toFixed(3)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`); }
  line(v,color=C.ink,width=1.4) { this.parts.push(`<polyline points="${v.map(p=>this.p(...p).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`); }
  box(x,y,w,d,z,h,fill) {
    this.poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],fill);
    this.poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],fill);
    this.poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],fill);
  }
  circle(x,y,z,r,fill) { const [cx,cy]=this.p(x,y,z); this.parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${C.ink}" stroke-width="1.4"/>`); }
  ellipse(x,y,z,rx,ry,fill) {const [cx,cy]=this.p(x,y,z);this.parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${C.ink}" stroke-width="1.4"/>`);}
  svg() { return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}">${this.parts.join('')}</svg>`; }
}
function legs(s,x,y,w,d,z,fill=C.oak,t=.13) {for(const [a,b] of [[x,y],[x+w-t,y],[x,y+d-t],[x+w-t,y+d-t]])s.box(a,b,t,t,.04,z,fill);}
function furniture(id,direction,variant) {
  const configs={ 'bed-basic':[320,288,2,3,4], 'desk-work':[192,224,2,1,4], 'chair-work':[128,192,1,1,4], 'table-dining':[256,224,2,2,3], stool:[128,128,1,1,2], 'lamp-desk':[128,192,1,1,4], 'rug-small':[320,168,3,2,0], 'plant-monstera':[128,192,1,1,4] };
  let [w,h,x,y,z]=configs[id]; const rot=direction==='b'; const s=new Scene(w,h,rot?y:x,rot?x:y,rot);
  const fabric=variant==='cream'?C.cream:C.sage;
  if(id==='bed-basic') {
    legs(s,.06,.06,1.88,2.88,.8,C.oak,.17);
    s.box(.06,.06,1.88,.15,.8,3.12,C.oak);
    s.box(.06,.21,1.88,2.73,.78,.38,C.oak);
    s.box(.12,.22,1.76,2.64,1.16,.55,C.cream);
    s.box(.1,1.04,1.8,1.84,1.18,.56,fabric);
    s.box(.34,.32,1.32,.59,1.72,.23,variant==='cream'?C.leaf:C.cream);
    s.line([[.12,1.24,1.76],[1.88,1.24,1.76]],variant==='cream'?C.oak:C.cream,2);
    s.line([[.3,.06,2.95],[.3,.06,1.9],[1.7,.06,1.9],[1.7,.06,2.95]],C.warm);
  } else if(id==='desk-work') {
    legs(s,.06,.06,1.88,.88,2.65);
    s.box(.04,.04,1.92,.92,2.68,.22,C.oak);
    s.box(1.13,.15,.65,.65,1.7,.87,C.oak);
    s.line([[1.14,.81,2.18],[1.77,.81,2.18]]); s.circle(1.47,.815,2.4,2,C.metal);
    s.box(.3,.2,.72,.49,2.92,.06,C.sage);
    s.poly([[.36,.23,2.99],[.94,.23,2.99],[.94,.61,2.99],[.36,.61,2.99]],C.metal);
    s.circle(1.58,.35,2.96,7,C.cream);
  } else if(id==='chair-work') {
    legs(s,.12,.12,.76,.76,1.7);
    s.box(.1,.1,.8,.8,1.7,.24,C.sage);
    s.box(.12,.06,.12,.13,1.9,1.9,C.oak); s.box(.76,.06,.12,.13,1.9,1.9,C.oak);
    s.box(.1,.06,.8,.15,2.62,1.1,C.sage);
    s.line([[.2,.22,2.95],[.8,.22,2.95]],C.cream);
  } else if(id==='table-dining'||id==='stool') {
    const sz=id==='stool'?.88:1.88,ht=id==='stool'?1.7:2.65;
    legs(s,.06,.06,sz,sz,ht,id==='stool'?C.sage:C.oak);
    s.box(.04,.04,sz+.04,sz+.04,ht,.22,id==='stool'?C.sage:C.oak);
    if(id==='table-dining')s.poly([[.72,.4,2.89],[1.55,.4,2.89],[1.55,1.6,2.89],[.72,1.6,2.89]],C.cream);
  } else if(id==='lamp-desk') {
    s.ellipse(.5,.5,.13,23,10,C.cream);
    s.line([[.5,.5,.2],[.5,.5,2.5],[.3,.5,3.25]],C.ink,5);
    s.line([[.5,.5,.2],[.5,.5,2.5],[.3,.5,3.25]],C.metal,2.5);
    const [cx,cy]=s.p(.3,.5,3.25);s.parts.push(`<path d="M ${cx-8} ${cy-8} L ${cx+9} ${cy-8} L ${cx+21} ${cy+22} Q ${cx} ${cy+30} ${cx-21} ${cy+22} Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`);
    s.ellipse(.3,.5,2.54,21,6,C.wall);
  } else if(id==='rug-small') {
    s.poly([[.03,.03,0],[2.97,.03,0],[2.97,1.97,0],[.03,1.97,0]],C.sage);
    s.poly([[.18,.18,.004],[2.82,.18,.004],[2.82,1.82,.004],[.18,1.82,.004]],C.cream);
    s.poly([[.24,.24,.008],[2.76,.24,.008],[2.76,1.76,.008],[.24,1.76,.008]],C.sage);
    for(let x=.52;x<2.7;x+=.48)s.poly([[x,.92,.009],[x+.12,.8,.009],[x+.24,.92,.009],[x+.12,1.04,.009]],C.leaf,'none');
  } else if(id==='plant-monstera') {
    const [cx,cy]=s.p(.5,.5,0);
    s.parts.push(`<path d="M ${cx-17} ${cy-39} L ${cx+17} ${cy-39} L ${cx+12} ${cy-5} Q ${cx} ${cy+3} ${cx-12} ${cy-5} Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`);
    s.ellipse(.5,.5,1.22,17,6,C.wall);
    for(const [dx,dy,flip] of [[-29,-89,-1],[25,-107,1],[-18,-127,-1],[18,-72,1],[0,-148,1]]) {
      const lx=cx+dx,ly=cy+dy;s.parts.push(`<path d="M ${cx} ${cy-36} Q ${cx+dx/2} ${ly+10} ${lx} ${ly}" fill="none" stroke="${C.sage}" stroke-width="2.5"/><g transform="translate(${lx} ${ly}) scale(${flip} 1)"><path d="M 0 20 C -25 13 -27 -7 -13 -16 C -4 -23 17 -18 23 -7 L 10 -4 L 24 1 L 21 9 L 8 5 L 15 17 C 10 23 3 24 0 20 Z" fill="${C.leaf}" stroke="${C.ink}" stroke-width="1.2"/><path d="M 0 19 L 2 -11 M 1 7 L -10 0" fill="none" stroke="${C.sage}" stroke-width="1.2"/></g>`);
    }
  }
  return {s,footprint:[rot?y:x,rot?x:y],height_z:z};
}
function wallAsset(id,state) {
  const bath=id==='door-bath',win=id==='window',w=bath?64:128,h=win?192:bath?288:320;
  // Wall attachment assets use a vertical plane; zero-depth footprint is intentional.
  const s=new Scene(w,h,bath?1:0,bath?0:2,bath); const span=bath?.96:1.96,high=win?3.95:7.95;
  const x=.02,y=.02;
  s.poly([[x,y,.05],[x,y+span,.05],[x,y+span,high],[x,y,high]],C.oak);
  const inner=[[x,y+.08,.22],[x,y+span-.08,.22],[x,y+span-.08,high-.16],[x,y+.08,high-.16]];
  s.poly(inner,win?C.metal:C.ink);
  if(win) {
    s.line([[x,y+span/2,.22],[x,y+span/2,high-.16]],C.oak,3);
    s.line([[x,y+.08,2],[x,y+span-.08,2]],C.oak,3);
    s.line([[x,y+.25,2.5],[x,y+.64,3.3]],C.cream,2);
  } else if(state==='closed') {
    s.poly(inner,bath?C.cream:C.oak);
    s.poly([[x,y+.22,.55],[x,y+span-.22,.55],[x,y+span-.22,high-.5],[x,y+.22,high-.5]],bath?C.wall:C.warm);
    s.circle(x,y+span-.18,3.7,2.4,C.metal);
  } else {
    // Hinge is the upper-right jamb; panel swings toward the room within the frame.
    const ex=span*.52,ey=-span*.48,hinge=y+span;
    s.poly([[x,hinge,.22],[x+ex,hinge+ey,.22],[x+ex,hinge+ey,high-.16],[x,hinge,high-.16]],bath?C.cream:C.oak);
    s.line([[x+ex*.15,hinge+ey*.15,.7],[x+ex*.85,hinge+ey*.85,.7],[x+ex*.85,hinge+ey*.85,high-.6],[x+ex*.15,hinge+ey*.15,high-.6],[x+ex*.15,hinge+ey*.15,.7]],bath?C.wall:C.warm);
    s.circle(x+ex*.86,hinge+ey*.86,3.7,2.4,C.metal);
  }
  return {s,footprint:bath?[1,0]:[0,2],height_z:win?4:8};
}
function room() {
  const s=new Scene(1152,896,8,8);
  s.poly([[0,0,0],[8,0,0],[8,8,0],[0,8,0]],C.oak);
  // Exact 8x8 diamond floor, planks stay in the same flat color.
  for(let i=1;i<8;i++) {s.line([[i,0,0],[i,8,0]],C.warm,.8);s.line([[0,i,0],[8,i,0]],C.warm,.8);}
  s.poly([[0,0,0],[0,8,0],[0,8,9],[0,0,9]],C.wall);
  s.poly([[0,0,0],[8,0,0],[8,0,9],[0,0,9]],C.cream);
  s.line([[0,8,.25],[0,0,.25],[8,0,.25]],C.oak,4);
  // Bathroom is exactly x=[5,8], y=[0,3].
  s.poly([[5,0,.015],[8,0,.015],[8,3,.015],[5,3,.015]],C.leaf);
  for(let i=1;i<3;i++){s.line([[5+i,0,.02],[5+i,3,.02]],C.cream,.7);s.line([[5,i,.02],[8,i,.02]],C.cream,.7);}
  // Kitchen cabinets are fixed; worktop and basin are separate materials.
  for(let x=.3;x<4.5;x+=1.05){s.box(x,.05,1.03,.85,.04,2.55,C.sage);s.circle(x+.82,.91,2.04,2,C.warm);}
  s.box(.25,.02,4.25,.92,2.6,.18,C.cream);
  s.poly([[1.1,.19,2.79],[2.07,.19,2.79],[2.07,.74,2.79],[1.1,.74,2.79]],C.metal);
  s.line([[1.57,.2,2.8],[1.57,.2,3.5],[1.57,.43,3.5],[1.57,.43,3.15]],C.ink,4);
  s.line([[1.57,.2,2.8],[1.57,.2,3.5],[1.57,.43,3.5],[1.57,.43,3.15]],C.metal,2);
  // Fixed bath appliances, leaving a one-tile entry in the front partition.
  s.box(5.25,.16,.8,.38,.2,1.7,C.cream);
  s.box(5.3,.4,.7,1.05,.1,.65,C.cream);s.ellipse(5.65,.95,.8,20,11,C.cream);s.ellipse(5.65,.95,.83,12,6,C.metal);
  s.box(6.5,.1,.83,.6,1.6,.3,C.cream);s.ellipse(6.92,.41,1.92,16,8,C.metal);
  s.line([[6.92,.2,1.95],[6.92,.2,2.45],[6.92,.4,2.45]],C.metal,3);
  s.line([[7.65,.06,.8],[7.65,.06,5.7],[7.65,.55,5.7]],C.ink,4);s.line([[7.65,.06,.8],[7.65,.06,5.7],[7.65,.55,5.7]],C.metal,2);
  s.ellipse(7.65,.55,5.63,12,5,C.metal);
  s.poly([[7.25,.7,.03],[8,.7,.03],[8,1.9,.03],[7.25,1.9,.03]],C.metal);
  s.box(4.94,.02,.08,2.96,0,3,C.cream);
  s.box(5,2.94,1,.08,0,2.2,C.cream);s.box(7,2.94,.98,.08,0,2.2,C.cream);
  s.line([[0,8,9],[0,0,9],[8,0,9]],C.ink,3);
  return {s,footprint:[8,8],height_z:9};
}
async function main() {
 const manifests={room:[],furniture:[]};
 async function save(group,id,direction,variant,obj) {
   const name=`${id}_${direction}_${variant}`;const dir=path.join(root,group);fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,name+'.svg'),obj.s.svg());
   await sharp(Buffer.from(obj.s.svg())).png({compressionLevel:9,palette:true,colours:64,dither:0}).toFile(path.join(dir,name+'.png'));
   manifests[group].push({id,file:name+'.png',source:name+'.svg',footprint_tiles:obj.footprint,height_z:obj.height_z,direction,variant,frame_px:[obj.s.w,obj.s.h],anchor_px:[obj.s.w/2+(obj.footprint[0]-obj.footprint[1])*32,obj.s.h],mount_origin_px:obj.s.p(0,0,0)});
 }
 await save('room','room-shell-tro','a','default',room());
 for(const [id,dirs,variants] of [['bed-basic',['a','b'],['sage','cream']],['desk-work',['a','b'],['oak']],['chair-work',['a','b'],['sage']],['table-dining',['a'],['oak']],['stool',['a'],['sage']],['lamp-desk',['a'],['cream']],['rug-small',['a'],['sage']],['plant-monstera',['a'],['default']]])
   for(const direction of dirs)for(const variant of variants)await save('furniture',id,direction,variant,furniture(id,direction,variant));
 for(const [id,states] of [['door-main',['closed','open']],['window',['a']],['door-bath',['closed','open']]])for(const state of states)await save('room',id,state,'default',wallAsset(id,state));
 for(const [group,assets] of Object.entries(manifests)) fs.writeFileSync(path.join(root,group,'manifest.json'),JSON.stringify({schema_version:1,tile_px:[128,64],z_px:32,projection:'orthographic-2:1',anchor:'actual bottom footprint vertex; see README for rectangular-frame conflict',palette_reference:'app/public/assets/static-scenes/rental-diamond.png',palette,assets},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1});
