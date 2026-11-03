const assert=require('node:assert/strict');
const {createBauCuaSession,SHAKE_DURATION}=require('../.test-build/domain/bau-cua-session.js');
const {engine}=require('../.test-build/domain/engine.js');
const {emptyBets}=require('../.test-build/domain/bau-cua.js');
(async()=>{
 let now=0,id=0,state=engine.initial(),commits=0,rolls=0;const queue=new Map(),busy=[];
 const session=createBauCuaSession(()=>state,next=>{state=next;commits++},x=>busy.push(x),(fn,delay)=>{const token=++id;queue.set(token,{fn,time:now+delay});return token},token=>queue.delete(token),()=>{rolls++;return ['ca','ca','ca']});
 const tick=ms=>{now+=ms;for(const [token,item] of queue)if(item.time<=now){queue.delete(token);item.fn()}};
 const original=JSON.stringify(state),bets={...emptyBets(),ca:10000};
 const pending=session.play(bets);bets.ca=100000;
 assert.equal(JSON.stringify(state),original);assert.equal(rolls,0);assert.equal(commits,0);assert.deepEqual(busy,[true]);
 assert.equal((await session.play({...emptyBets(),bau:10000})).ok,false);
 tick(SHAKE_DURATION-1);assert.equal(JSON.stringify(state),original);assert.equal(rolls,0);assert.equal(commits,0);
 tick(1);const result=await pending;assert(result.ok);assert.equal(result.round.stake,10000);assert.equal(state.money,5230000);assert.equal(state.bauCuaLast.payout,40000);assert.equal(state.ledger.length,2);assert.equal(rolls,1);assert.equal(commits,1);assert.deepEqual(busy,[true,false]);
 tick(SHAKE_DURATION*2);assert.equal(commits,1);
 // Settlement reads the current state, retaining purchases made after phone close.
 const next=session.play({...emptyBets(),ca:10000});state=engine.buy(state,'plant').state;tick(SHAKE_DURATION);assert((await next).ok);assert(state.owned.includes('plant'));assert.equal(state.money,5080000);
 const beforeCancel=JSON.stringify(state),cancelled=session.play({...emptyBets(),ca:10000});session.cancel();assert.equal((await cancelled).ok,false);tick(SHAKE_DURATION);assert.equal(JSON.stringify(state),beforeCancel);assert.equal(queue.size,0);
 // Insufficient balance at completion does not write a partial result.
 const failed=session.play({...emptyBets(),ca:10000});state={...state,money:0};const beforeFailure=JSON.stringify(state);tick(SHAKE_DURATION);assert.equal((await failed).ok,false);assert.equal(JSON.stringify(state),beforeFailure);
 console.log('PASS: wallet/ledger/RNG unchanged before shake completion, single settlement, duplicate guard, current-state preservation, cancellation and failed bets.');
})().catch(error=>{console.error(error);process.exit(1)});
