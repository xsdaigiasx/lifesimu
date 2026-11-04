const fs=require('fs'),path=require('path'),sharp=require('sharp');
const {cfg,root,svg}=require('./render.cjs'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),font='DejaVu Sans';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
(async()=>{
 fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});
 let board=`<svg width="1600" height="1230" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="1230" fill="#fbf3e2"/><text x="28" y="43" font-family="${font}" font-size="30" font-weight="bold" fill="#4a3b33">BỐN MẶT BẰNG NHÀ Ở</text><text x="28" y="74" font-family="${font}" font-size="17" fill="#6f7666">#89 / Lô 4 — lưới 128×64, tọa độ chính xác theo ô; nhãn và vệt cửa chỉ có trên ảnh review</text>`;
 const layers=[];
 for(let i=0;i<cfg.floors.length;i++){const f=cfg.floors[i],m=manifest.items[i],x=24+i%2*792,y=100+Math.floor(i/2)*560;
  board+=`<rect x="${x}" y="${y}" width="760" height="536" rx="16" fill="#fffaf0" stroke="#dfd4c1"/><text x="${x+18}" y="${y+33}" font-family="${font}" font-size="24" fill="#4a3b33">${esc(f.name)}</text><text x="${x+18}" y="${y+61}" font-family="${font}" font-size="15" fill="#6f7666">Sàn ${f.w}×${f.h} ô · ${m.frame_px.join('×')} px · ${(m.bytes/1000).toFixed(1)} KB</text><text x="${x+18}" y="${y+501}" font-family="${font}" font-size="15" fill="#4a3b33">Cửa màu cam: 2 ô · Thang (${f.stairs.x}, ${f.stairs.y}) 4×4 · ${f.floor===1?'đi lên':'đi xuống'}</text><text x="${x+18}" y="${y+524}" font-family="${font}" font-size="13" fill="#6f7666">Phòng ngoài vùng màu: hành lang · Nền không có đồ nội thất</text>`;
  const art=await sharp(Buffer.from(svg(f,true))).resize(724,414,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();layers.push({input:art,left:x+18,top:y+73});
 }
 board+='</svg>';await sharp(Buffer.from(board)).composite(layers).webp({quality:94,effort:6}).toFile(path.join(__dirname,'previews/lot-4.webp'));
 let phone=`<svg width="380" height="1188" xmlns="http://www.w3.org/2000/svg"><rect width="380" height="1188" fill="#fbf3e2"/><text x="14" y="29" font-family="${font}" font-size="19" font-weight="bold" fill="#4a3b33">Lô 4 — tổng thể trên điện thoại</text><text x="14" y="52" font-family="${font}" font-size="11" fill="#6f7666">Khung 380 px · ảnh nguồn lớn để tích hợp kéo / zoom</text>`;
 const mobile=[];
 for(let i=0;i<cfg.floors.length;i++){const f=cfg.floors[i],m=manifest.items[i],y=66+i*278;phone+=`<rect x="12" y="${y}" width="356" height="264" rx="12" fill="#fffaf0" stroke="#dfd4c1"/><text x="24" y="${y+26}" font-family="${font}" font-size="17" fill="#4a3b33">${esc(f.name)}</text><text x="24" y="${y+249}" font-family="${font}" font-size="11" fill="#6f7666">${f.w}×${f.h} ô · ${(m.bytes/1000).toFixed(1)} KB · cửa 2 ô</text>`;const art=await sharp(path.join(root,'app/public',m.file)).resize(340,204,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();mobile.push({input:art,left:20,top:y+34});}
 phone+='</svg>';await sharp(Buffer.from(phone)).composite(mobile).webp({quality:94,effort:6}).toFile(path.join(__dirname,'previews/mobile-380.webp'));console.log('Two floor preview sheets ready');
})().catch(e=>{console.error(e);process.exit(1)});
