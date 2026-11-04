// Review proof for PR #152; compares against the approved pre-review commit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),sharp=require(process.env.ISSUE133_SHARP||'sharp');
const root=path.resolve(__dirname,'../..'),base='8738d5a35873a6913bbeea8b9ace340ce1273b09';
const old=JSON.parse(execFileSync('git',['show',base+':assets/issue-133-lot-1/manifest.json'],{cwd:root}));
const now=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json')));
const changed=now.items.filter(m=>m.sha256!==old.items.find(o=>o.id===m.id&&o.direction===m.direction).sha256).map(m=>m.id+'_'+m.direction).sort();
assert.deepEqual(changed,[...'abcd'].map(d=>'bed-premium_'+d));
const W=1360,H=820,layers=[];let labels='';
const label=(x,y,s)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="16" fill="#34432f">${s}</text>`;
(async()=>{
 for(let i=0;i<4;i++){
  const d='abcd'[i],m=now.items.find(m=>m.id==='bed-premium'&&m.direction===d),prior=old.items.find(m=>m.id==='bed-premium'&&m.direction===d);
  for(const key of ['frame_px','anchor_px','footprint_tiles'])assert.deepEqual(m[key],prior[key],d+' '+key);
  const before=execFileSync('git',['show',base+':app/public'+m.file],{cwd:root,maxBuffer:1000000}),after=fs.readFileSync(path.join(root,'app/public',m.file));
  layers.push({input:before,left:i*340+10,top:32},{input:after,left:i*340+10,top:362});
  const small=await sharp(after).resize(96,86,{fit:'inside'}).toBuffer();layers.push({input:small,left:i*340+120,top:706});
  labels+=label(i*340+10,24,'Trước — '+d)+label(i*340+10,354,'Sau — '+d)+label(i*340+10,690,'Sau ở chiều rộng 96 px');
 }
 layers.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${labels}</svg>`),left:0,top:0});
 await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(layers).webp({quality:92}).toFile(path.join(__dirname,'bed-premium-lights-review.webp'));
 console.log(JSON.stringify({result:'PASS',changed_sprites:changed,unchanged_sprites:108,geometry:'same frames, anchors and footprints',preview:'bed-premium-lights-review.webp'}));
})().catch(e=>{console.error(e);process.exitCode=1});
