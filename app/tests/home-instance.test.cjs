const assert=require('node:assert/strict');
const {homeOf,homeError,saveHome,buyHome,validHome,uidOf,HOME_MAX}=require('../.test-build/domain/home');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial(),money:50000000};
assert.deepEqual(homeOf(s).items.map(uidOf),['bed','desk']);
// mua nhiều cái theo trần: cây 3, đèn 3, tranh 3; giường chỉ 1
for(let n=1;n<=3;n++){const r=buyHome(s,'plant');assert(r.ok,'cây '+n);s=r.state}
assert.deepEqual(homeOf(s).items.filter(i=>i.id==='plant').map(uidOf),['plant','plant-2','plant-3']);
assert.equal(buyHome(s,'plant').ok,false);assert.equal(HOME_MAX.plant,3);
assert.equal(buyHome(s,'bed').ok,false);
assert(engine.parse(JSON.stringify(s)));
// đặt bản thể thứ 2 vào chỗ khác, lưu và tải lại đúng vị trí, hướng
const items=homeOf(s).items.map(i=>uidOf(i)==='plant-2'?{...i,x:3,y:5,rotation:90,placed:true}:uidOf(i)==='plant'?{...i,x:5,y:5,placed:true}:i);
assert.equal(homeError(items),null);
const saved=saveHome(s,items);assert(saved.ok,saved.error);
const back=engine.parse(JSON.stringify(saved.state));assert(back);
const p2=homeOf(back).items.find(i=>uidOf(i)==='plant-2'),p1=homeOf(back).items.find(i=>uidOf(i)==='plant');
assert.deepEqual([p2.x,p2.y,p2.rotation,p2.placed],[3,5,90,true]);assert.deepEqual([p1.x,p1.y,p1.placed],[5,5,true]);
assert.equal(homeOf(back).items.find(i=>uidOf(i)==='plant-3').placed,false);
// hai cây không chồng ô; trùng uid bị từ chối
assert(homeError(items.map(i=>uidOf(i)==='plant-2'?{...i,x:5,y:5,rotation:0}:i)));
const dupe=homeOf(s).items.map(i=>uidOf(i)==='plant-2'?{...i,uid:'plant'}:i);
assert.equal(validHome({items:dupe,grid:8}),false);assert(!saveHome(s,dupe).ok);
// lưu không được đổi tập đồ sở hữu
assert(!saveHome(s,items.filter(i=>uidOf(i)!=='plant-3')).ok);
// hai tranh: cùng tường thì chồng nhau, khác tường thì được; trần 2
let t={...engine.initial(),money:50000000};for(let n=0;n<2;n++)t=buyHome(t,'painting').state;
assert.equal(buyHome(t,'painting').ok,false);
const wall=(w,x,y)=>homeOf(t).items.map(i=>i.id==='painting'?(uidOf(i)==='painting'?{...i,mount:'wall',wall:'left',x:0,y:6,placed:true}:{...i,mount:'wall',wall:w,x,y,placed:true}):i);
assert(homeError(wall('left',0,6)));
assert.equal(homeError(wall('right',5,0)),null);
// Việc 7: ô tường theo lưới 8 ô, cấm cửa sổ (trái 2–5), tủ bếp (sau 0–4), vòi sen (sau 7)
{const H=require('../.test-build/domain/home'),G=require('../.test-build/domain/home-geometry');
 assert.deepEqual(H.wallSlots('painting'),[{wall:'left',at:0},{wall:'left',at:6},{wall:'right',at:5}]);
 assert(homeError(wall('left',0,2)));assert(homeError(wall('left',0,5)));assert(homeError(wall('right',0,0)));assert(homeError(wall('right',6,0)));assert(homeError(wall('left',0,6.5)));
 assert.equal(homeError(homeOf(t).items.map(i=>i.id==='painting'?{...i,mount:'wall',wall:'left',x:0,y:uidOf(i)==='painting'?0:6,placed:true}:i)),null);
 // tranh không đặt trên sàn được
 assert(homeError(homeOf(t).items.map(i=>uidOf(i)==='painting'?{...i,mount:undefined,x:2,y:4,placed:true}:i)));
 // kéo: bám ô trống gần điểm chạm nhất, bỏ ô đã có tranh khác
 const items=wall('left',0,6),p2=items.find(i=>uidOf(i)==='painting-2');
 const near=s=>G.wallPoint(s.wall,s.at,2);
 assert.deepEqual(G.nearestWallSlot(p2,items,near({wall:'right',at:5})),{wall:'right',at:5});
 assert.deepEqual(G.nearestWallSlot(p2,items,near({wall:'left',at:6})),{wall:'left',at:0});
 const full=items.map(i=>uidOf(i)==='painting'?{...i,wall:'right',x:5,y:0}:i).map(i=>uidOf(i)==='painting-2'?H.onWall(i,{wall:'left',at:0}):i);assert.equal(homeError(full),null);
 // save cũ: tranh ở ô nay bị cấm (tủ bếp, cửa sổ) thì cất vào kho, lát cắt home vẫn hợp lệ
 const old=JSON.parse(JSON.stringify(t));old.home={grid:8,items:[...homeOf(t).items.map(i=>uidOf(i)==='painting'?{...i,mount:'wall',wall:'right',x:0,y:0,placed:true}:uidOf(i)==='painting-2'?{...i,mount:'wall',wall:'left',x:0,y:6,placed:true}:i)]};
 assert(H.validHome(old.home));assert(engine.parse(JSON.stringify(old)));
 const fixed=homeOf(old).items;assert.equal(fixed.find(i=>uidOf(i)==='painting').placed,false);assert.equal(fixed.find(i=>uidOf(i)==='painting-2').placed,true);
 // lưu bố cục vẫn chặn ô cấm (không tự sửa khi lưu)
 assert(!H.saveHome({...old,home:undefined},old.home.items).ok);
}
// save cũ chưa có uid vẫn tải được và được gán mã
const legacy=JSON.parse(JSON.stringify(engine.initial()));legacy.home={grid:8,items:[{id:'bed',x:0,y:3,rotation:0,placed:true},{id:'desk',x:0,y:6,rotation:0,placed:true}]};
assert(engine.parse(JSON.stringify(legacy)));assert.deepEqual(homeOf(legacy).items.map(uidOf),['bed','desk']);
console.log('PASS home instances: uid, caps, save/load by uid, duplicates, wall overlap, legacy saves');
// T27: lối đi nối bếp, vệ sinh, giường
{const {homeWalkError}=require('../.test-build/domain/home');
 const base=homeOf(engine.initial()).items;assert.equal(homeWalkError(base),null);
 const wall=(extra)=>[...base,...extra];
 // hàng tủ chắn ngang phòng, tách bếp khỏi giường
 const fence=[0,2,4,6].map((x,k)=>({id:'wardrobe',uid:k?'wardrobe-'+(k+1):'wardrobe',x,y:2,rotation:0,placed:true}));
 assert(homeWalkError(wall(fence)),'tủ chắn');
 // chắn kín ô trước bếp
 const kitchen=[0,1,2,3,4].map(x=>({id:'plant',uid:'k'+x,x,y:1,rotation:0,placed:true}));
 assert(homeWalkError(wall(kitchen)),'chắn bếp');
 // thảm không chắn lối
 assert.equal(homeWalkError(wall([{id:'rug',x:2,y:2,rotation:0,placed:true}])),null);
 // đồ trong kho không chiếm ô
 assert.equal(homeWalkError(wall(fence.map(i=>({...i,placed:false})))),null);
 // lưu: thoáng thì được, chắn kín ba ô trước bếp thì bị từ chối
 let s2={...engine.initial(),money:50000000};for(let n=0;n<3;n++)s2=buyHome(s2,'plant').state;
 const put=(xs)=>homeOf(s2).items.map(i=>i.id==='plant'?{...i,x:xs[Number(i.uid==='plant'?1:i.uid.slice(-1))-1],y:1,placed:true}:i);
 const ok=saveHome(s2,put([1,2,5]));assert.equal(ok.ok,false,'(5,1) nằm trong khu vệ sinh nên không hợp lệ');
 const part=saveHome(s2,homeOf(s2).items.map(i=>i.uid==='plant'?{...i,x:2,y:1,placed:true}:i));assert.equal(part.ok,true,part.error);
 const shut=saveHome(s2,homeOf(s2).items.map(i=>i.id==='plant'?{...i,x:{plant:1,'plant-2':2,'plant-3':3}[i.uid],y:1,placed:true}:i));
 assert.equal(shut.ok,false);assert.equal(shut.error,'Chừa lối đi tới bếp, vệ sinh và giường.');
 console.log('PASS home walkability BFS');
}
