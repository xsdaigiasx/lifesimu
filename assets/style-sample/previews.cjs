const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '../..');
const manifest = require('./manifest.json');
const project = (x,y) => [724+64*(x-y),350+32*(x+y)];
const placements = [{ id:'desk',direction:'a',x:2,y:1 },{ id:'bed',direction:'a',x:1,y:3 },{ id:'wardrobe',direction:'a',x:4,y:5 }];
const poly = (x,y,w,h,color) => `<polygon points="${[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(p=>project(...p).join(',')).join(' ')}" fill="${color}" fill-opacity="0.17" stroke="${color}" stroke-width="2"/>`;
async function main() {
  const layers = [];
  for(const p of placements) {
    const i=manifest.items.find(i=>i.id===p.id && i.direction===p.direction);
    const bottom=project(p.x+i.footprint_tiles[0],p.y+i.footprint_tiles[1]);
    layers.push({input:path.join(ROOT,i.file),left:bottom[0]-i.anchor_px[0],top:bottom[1]-i.anchor_px[1]});
  }
  const room = await sharp(path.join(ROOT,manifest.room.file)).composite(layers).png().toBuffer();
  await sharp(room).webp({quality:85}).toFile(path.join(__dirname,'rental-sample.webp'));
  const lines=[];
  for(let n=0;n<=8;n++) for(const pair of [[[n,0],[n,8]],[[0,n],[8,n]]]) {
    const a=project(...pair[0]),b=project(...pair[1]);
    lines.push(`<path d="M${a} L${b}" stroke="#178290" stroke-opacity="0.6" stroke-width="1.5"/>`);
  }
  lines.push(poly(0,0,5,1,'#cd811e'),poly(5,0,3,3,'#5367ba'));
  for(const p of placements) {
    const i=manifest.items.find(i=>i.id===p.id&&i.direction===p.direction);
    lines.push(poly(p.x,p.y,...i.footprint_tiles,'#8b3669'));
    const a=project(p.x+i.footprint_tiles[0],p.y+i.footprint_tiles[1]);
    lines.push(`<circle cx="${a[0]}" cy="${a[1]}" r="5" fill="#b82755"/>`);
  }
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1448" height="1086">${lines.join('')}</svg>`);
  await sharp(room).composite([{input:svg}]).webp({quality:85}).toFile(path.join(__dirname,'previews/room-grid.webp'));
  await sharp(room).resize(380).flatten({background:'#faf3e5'}).webp({quality:88}).toFile(path.join(__dirname,'previews/mobile-380.webp'));
  const sheet=[];
  for(let row=0;row<3;row++) for(let col=0;col<4;col++) {
    const item=manifest.items.find(i=>i.id===['bed','wardrobe','desk'][row]&&i.direction==='abcd'[col]);
    const card=await sharp(path.join(ROOT,item.file)).resize({width:300,height:260,fit:'inside'}).png().toBuffer();
    const meta=await sharp(card).metadata();
    sheet.push({input:card,left:col*340+Math.round((340-meta.width)/2),top:row*310+35});
  }
  const labels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1360" height="930">${['bed','wardrobe','desk'].flatMap((id,r)=>'abcd'.split('').map((d,c)=>`<text x="${c*340+170}" y="${r*310+25}" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#4a3b33">${id}-comfort_${d}</text>`)).join('')}</svg>`);
  await sharp({create:{width:1360,height:930,channels:4,background:'#faf3e5'}}).composite([...sheet,{input:labels}]).webp({quality:86}).toFile(path.join(__dirname,'previews/rotations.webp'));
  fs.writeFileSync(path.join(__dirname,'placements.json'),JSON.stringify(placements,null,2)+'\n');
  console.log('Rendered assembled room, grid, 380px and 12-direction contact sheet.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
