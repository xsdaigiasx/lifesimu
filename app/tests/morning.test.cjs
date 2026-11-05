const assert=require('node:assert/strict');
const {morningOf,morningDue,markMorningSeen,validMorning}=require('../.test-build/domain/morning');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial()};
assert(!morningDue(s),'ngày 0 chưa có bản tin');
s={...s,day:3};
assert(morningDue(s));
const m=morningOf(s);
assert(m.hood.length>0);assert.equal(m.unread.count,0);assert(Array.isArray(m.agenda));
s=markMorningSeen(s);assert(!morningDue(s));assert.equal(s.morning.seen,3);
assert(morningDue({...s,day:4}));
assert(engine.valid(s));
assert(!engine.valid({...s,morning:{seen:99}}));
assert(engine.valid({...engine.initial(),day:5}),'save cũ không có morning vẫn hợp lệ');
// tin nhắn chưa đọc và lịch hẹn
const t={...s,day:4,inbox:{version:1,seq:1,threads:{mom:[{id:'a',day:4,minute:420,from:'npc',text:'hi',kind:'note'}]},queue:[],appts:[],called:{},hello:{}}};
const mm=morningOf(t);assert.equal(mm.unread.count,1);assert.equal(mm.unread.names.length,1);
console.log('morning ok');
