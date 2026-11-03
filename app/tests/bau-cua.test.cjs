const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine.js');
const {FACES, emptyBets, playBauCua, validRound} = require('../.test-build/domain/bau-cua.js');
let checked=0;
// Exhaust every three-die outcome and every single-face bet, including repeats.
for(const a of FACES) for(const b of FACES) for(const c of FACES) for(const face of FACES){
 const before=engine.initial(), bets={...emptyBets(),[face]:10000};
 const result=playBauCua(before,bets,()=>[a,b,c]);
 assert(result.ok);const count=[a,b,c].filter(x=>x===face).length;
 assert.equal(result.round.payout,count?10000*(1+count):0);
 assert.equal(result.state.money,before.money-10000+result.round.payout);
 assert.equal(before.money,5200000);assert.equal(before.ledger.length,0);
 assert.equal(result.state.day,before.day);assert(engine.valid(result.state));
 assert.deepEqual(engine.parse(JSON.stringify(result.state)),result.state);checked++;
}
const bets=Object.fromEntries(FACES.map(f=>[f,10000]));
const mixed=playBauCua(engine.initial(),bets,()=>['ca','ca','cua']);assert(mixed.ok);assert.equal(mixed.round.stake,60000);assert.equal(mixed.round.payout,50000);
assert.equal(mixed.state.ledger.reduce((n,x)=>n+x.amount,0),-10000);
let rolled=false;const shouldNotRoll=()=>{rolled=true;return ['ca','ga','nai']};
for(const invalid of [emptyBets(),{...emptyBets(),ca:-10000},{...emptyBets(),ca:1.5},{...emptyBets(),ca:NaN},{...emptyBets(),ca:Infinity},{...emptyBets(),ca:5000},{...emptyBets(),ca:5300000}])assert.equal(playBauCua(engine.initial(),invalid,shouldNotRoll).ok,false);
assert.equal(rolled,false);
assert.equal(playBauCua(engine.initial(),bets,()=>{throw Error('rng')}).ok,false);
assert.equal(playBauCua(engine.initial(),bets,()=>['invalid','ca','ca']).ok,false);
assert.equal(validRound({...mixed.round,payout:99999}),false);
assert.equal(engine.parse(JSON.stringify({...mixed.state,bauCuaLast:{...mixed.round,day:100}})),null);
let state=engine.initial();for(let n=0;n<60;n++){const r=playBauCua(state,{...emptyBets(),ca:10000},()=>['ca','ga','nai']);assert(r.ok);state=r.state}assert.equal(state.ledger.length,100);assert(engine.valid(state));
console.log(`Bầu cua: ${checked} exhaustive settlements, multiple bets, validation, save and ledger checks passed.`);
