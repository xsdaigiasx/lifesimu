// Native geometry guide only; final artwork is generated with imagegen.
const fs=require('fs'),path=require('path'),sharp=require('sharp');const W=2048,H=1408,P=(x,y,z=0)=>[1024+64*(x-y),320+32*(x+y)-z],poly=pts=>pts.map(p=>p.join(',')).join(' ');
let body='';const shape=(pts,fill)=>{body+='<polygon points="'+poly(pts)+'" fill="'+fill+'" stroke="#978974" stroke-width="2"/>'};
shape([P(0,14),P(14,14),P(14,14,-16),P(0,14,-16)],'#b19a73');shape([P(14,0),P(14,14),P(14,14,-16),P(14,0,-16)],'#ab906c');
shape([P(0,0),P(14,0),P(14,14),P(0,14)],'#dec497');
for(let i=0;i<=14;i++)for(const [a,b]of [[P(i,0),P(i,14)],[P(0,i),P(14,i)]])body+='<path d="M'+a+'L'+b+'" stroke="#b9a17c" stroke-width="1"/>';
shape([P(0,0),P(0,14),P(0,14,224),P(0,0,224)],'#e7dfc9');shape([P(0,0),P(14,0),P(14,0,224),P(0,0,224)],'#f1e8d6');
// Foreground cutaway parapets; two-tile doorway is x=[6,8], y=14.
for(const [a,b]of [[0,6],[8,14]])shape([P(a,14),P(b,14),P(b,14,32),P(a,14,32)],'#e7dfc9');
shape([P(14,0),P(14,14),P(14,14,32),P(14,0,32)],'#f1e8d6');
for(const x of [6,8]){const a=P(x,14),b=P(x,14,192);body+='<path d="M'+a+'L'+b+'" stroke="#a98150" stroke-width="12"/>'}body+='<path d="M'+P(6,14,192)+'L'+P(8,14,192)+'" stroke="#a98150" stroke-width="12"/>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'">'+body+'</svg>';
fs.writeFileSync(path.join(__dirname,'geometry-guide.svg'),svg);sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,'geometry-guide.png')).then(()=>console.log('2048x1408 guide; origin 1024,320; floor 1792x896; doorway x6..8 y14'));
