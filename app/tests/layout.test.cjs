const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {initialOffice}=require('../.test-build/domain/office');
const {getOfficeLayout,validateLayout,saveOfficeLayout,placementError,ROOM_GRIDS}=require('../.test-build/domain/layout');
const base=()=>({...engine.initial(),clock:{minute:480,location:'office',lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1},office:{...initialOffice(),role:'owner',leaseUntil:7}});
for(const size of ['small','medium','large']){const s=base();s.office.size=size;const l=getOfficeLayout(s);assert(validateLayout(l,s));assert.equal(l.owner.items.length,({small:8,medium:16,large:24})[size]*2);assert.equal(placementError(l.owner),null);}
let s=base(),l=getOfficeLayout(s);assert.equal(saveOfficeLayout(s,l).state,s);l.owner.items[0].placed=false;let r=saveOfficeLayout(s,l);assert(r.ok,r.error);assert.equal(r.state.clock.minute,485);assert.equal(r.state.money,s.money);assert.deepEqual(s,base());assert(engine.valid(r.state));assert(engine.parse(JSON.stringify(r.state)));
const changed=structuredClone(l);changed.owner.items[1].placed=false;r=saveOfficeLayout({...s,clock:{...s.clock,minute:1498}},changed);assert(!r.ok);assert(!saveOfficeLayout({...s,day:7},l).ok);assert(!saveOfficeLayout({...s,clock:{...s.clock,location:'home'}},l).ok);
let fake=structuredClone(l);fake.owner.items.push({id:'plant',kind:'plant',x:0,y:0,rotation:0,placed:false});assert(!saveOfficeLayout(s,fake).ok);assert(!validateLayout(fake,s));
fake=structuredClone(l);fake.owner.items.pop();assert(!saveOfficeLayout(s,fake).ok);fake=structuredClone(l);fake.owner.items.push({...fake.owner.items[0]});assert(!validateLayout(fake));
fake=getOfficeLayout(s);fake.owner.items[1].x=fake.owner.items[0].x;fake.owner.items[1].y=fake.owner.items[0].y;assert(!validateLayout(fake));
fake=structuredClone(l);let chair=fake.owner.items.find(i=>i.kind==='chair');chair.x=ROOM_GRIDS.small.columns/2-1;chair.y=ROOM_GRIDS.small.rows-1;assert.match(placementError(fake.owner),/cửa/);assert(!saveOfficeLayout(s,fake).ok);
s={...base(),office:{...base().office,role:'employee',employerId:'sen-code',employeeDecor:{plant:null}}};l=getOfficeLayout(s);assert(validateLayout(l,s));assert(l.employee.items.some(i=>i.id==='plant'));let locked=structuredClone(l);locked.employee.items.find(i=>i.id==='desk-1').placed=false;assert(!saveOfficeLayout(s,locked).ok);l.employee.items.find(i=>i.id==='desk-0').placed=false;assert(!saveOfficeLayout(s,l).ok);
s=base();s.office.ownerDecor={plant:null};l=getOfficeLayout(s);const plant=l.owner.items.find(i=>i.id==='plant');plant.x=11;plant.y=0;plant.placed=true;assert(validateLayout(l,s));plant.rotation=90;assert(validateLayout(l,s));plant.rotation=45;assert(!validateLayout(l,s));
assert(!validateLayout({version:1,owner:null}));assert(!validateLayout({...l,employee:undefined}));assert(!saveOfficeLayout({...base(),office:initialOffice()},getOfficeLayout(base())).ok);
console.log('PASS: office layout inventory, 8/16/24 seats, collisions, doors, rotation, role isolation, immutable save, permissions, lease, 5-minute cost and JSON round-trip.');
