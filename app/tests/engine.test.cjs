const assert = require('node:assert/strict');
const E = require('../.test-build/domain/engine.js').engine;
let s=E.initial(); assert(E.valid(s));
let r=E.buy(s,'plant'); assert(r.ok); assert.equal(s.money,5200000); s=r.state;
assert.equal(s.money,5020000); assert(s.equipped.includes('plant')); assert(!E.buy(s,'plant').ok);
r=E.toggle(s,'plant'); assert(r.ok); assert.equal(r.state.money,s.money); assert(!r.state.equipped.includes('plant'));
assert(!E.buy({...s,money:0},'rug').ok);
const work=E.advance(s,'work'); assert(work.ok); assert.equal(work.state.day,1); assert.equal(work.state.money,s.money+work.state.lastReport.earn-E.COST);
const rest=E.advance(work.state,'rest'); assert(rest.ok); assert(rest.state.energy>work.state.energy); assert(rest.state.stress<work.state.stress);
assert(E.advance({...s,money:0},'work').ok); assert(!E.advance({...s,money:0},'rest').ok);
assert(E.advance({...s,energy:100,health:100,stress:0},'work').state.lastReport.earn>E.advance({...s,energy:10,health:50,stress:90},'work').state.lastReport.earn);
let long=E.initial();for(let i=0;i<90;i++){const q=E.advance(long,i%3?'work':'rest');assert(q.ok);long=q.state;assert(E.valid(long));}
assert.equal(long.day,90);assert(long.ledger.length<=100);assert.deepEqual(E.parse(JSON.stringify(long)),long);
assert.equal(E.parse('{bad'),null);assert.equal(E.parse(JSON.stringify({...s,money:-1})),null);assert.equal(E.parse(JSON.stringify({...s,owned:['unknown']})),null);
console.log('PASS: purchases, duplicate protection, equipment, accounting, recovery, efficiency, 90-day simulation, save validation.');
