const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../.test-build/domain/portrait'),N=require('../.test-build/domain/npc');
const pub=path.join(__dirname,'../public'),man=JSON.parse(fs.readFileSync(path.join(pub,'assets/portrait/manifest.json'),'utf8'));

test('bảng mảnh khớp manifest của Codex và mọi ảnh có thật',()=>{
 const g=x=>x==='any'?'any':x,same=(layer,list)=>{const m=man.items.filter(i=>i.layer===layer);assert.deepEqual(list.map(p=>p.id).sort(),m.map(i=>i.id).sort(),layer);for(const p of list){const i=m.find(x=>x.id===p.id);assert.equal(p.g,g(i.gender),p.id);assert.deepEqual([...p.ages].sort(),[...i.ages].sort(),p.id);if(layer==='hair')assert.equal(!!p.grey,!!i.grey,p.id)}};
 same('outfit',P.OUTFITS);same('hair',P.HAIRS);same('extra',P.EXTRAS);assert.equal(man.items.filter(i=>i.layer==='base').length,24);
 for(const i of man.items)assert.ok(fs.existsSync(path.join(pub,'assets/portrait',i.layer,i.id+'.webp')),i.id);
});

test('độ chỉnh lớp phụ kiện trong portrait.ts khớp manifest',()=>{assert.deepEqual(P.EXTRA_ADJUST,man.adjust);assert.equal(P.FRAME,man.width);for(const k of Object.keys(man.adjust))assert.ok(man.items.some(i=>i.layer==='extra'&&i.id===k),k);assert.deepEqual(P.layerAdjust('/assets/portrait/extra/cap.webp'),{dx:0,dy:14,scale:1});assert.equal(P.layerAdjust('/assets/portrait/hair/f-bob.webp'),undefined)});

test('mặt ghép theo hồ sơ: đúng giới, tuổi, áo hợp vai, người già tóc bạc, đủ ảnh, tất định, đa dạng',()=>{
 const seen=new Set();
 for(let k=0;k<30;k++)for(const n of N.buildRoster('mat'+k)){const f=P.faceOf(n),a=P.ageBand(n.age),g=n.gender==='female'?'f':'m';
  assert.deepEqual(P.faceOf(n),f,'tất định');assert.ok(f.base.startsWith(`${g}-${a}-`),n.id+' '+f.base);
  for(const src of P.faceLayers(f))assert.ok(fs.existsSync(path.join(pub,src)),src);
  const hair=P.HAIRS.find(h=>h.id===f.hair);assert.ok(hair.ages.includes(a)&&hair.g===g,f.hair);if(a==='old')assert.ok(hair.grey,'người già tóc bạc');
  if(n.id==='doctor')assert.equal(f.outfit,'blouse-doctor');if(['veg','meat','banhmi'].includes(n.id))assert.ok(['apron','ba-ba','tee'].includes(f.outfit),f.outfit);
  if(n.quirk==='Luôn đội mũ lưỡi trai')assert.ok(f.extras.includes('cap'));assert.ok(f.extras.length<=2);
  for(const e of f.extras){const x=P.EXTRAS.find(y=>y.id===e);assert.ok((x.g==='any'||x.g===g)&&x.ages.includes(a),e)}
  seen.add(P.faceLayers(f).join('|'))}
 assert.ok(seen.size>=300,'đa dạng: '+seen.size);
});
