const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {weatherOf, forecastOf, parkClosed} = require('../.test-build/domain/weather');
const {travelOptions, goTo} = require('../.test-build/domain/time');
const {advance} = engine;

const count = {sunny: 0, mild: 0, rain: 0, storm: 0};
for (let d = 0; d < 365; d++) { assert.equal(weatherOf(d), weatherOf(d)); count[weatherOf(d)]++; }
assert.ok(count.storm >= 3 && count.storm <= 30, 'bão hiếm: ' + count.storm);
assert.ok(count.rain > 40 && count.sunny > 40 && count.mild > 20, JSON.stringify(count));
assert.equal(forecastOf(10), weatherOf(11));

const find = w => { for (let d = 0; d < 400; d++) if (weatherOf(d) === w) return d; throw new Error('không có ' + w); };
const g = engine.initial();
const at = d => ({...g, day: d, money: 1e7, energy: 100});
const far = ['office', 'market', 'mall', 'bank', 'hospital', 'park', 'streetfood', 'restaurant', 'apartments', 'villa'].sort((x, y) => (travelOptions(g, 'home', y).find(o => o.mode === 'walk')?.meters ?? 0) - (travelOptions(g, 'home', x).find(o => o.mode === 'walk')?.meters ?? 0))[0];
const modes = (d, to = far) => Object.fromEntries(travelOptions(at(d), 'home', to).map(o => [o.mode, o]));

const clear = find('sunny'), rain = find('rain'), storm = find('storm');
const a = modes(clear), r = modes(rain), s = modes(storm);
assert.ok(a.walk && r.walk, 'trời thường và mưa vẫn đi bộ được');
assert.ok(r.walk.energy > a.walk.energy, 'mưa đi bộ tốn thêm sức');
assert.ok(r.bus.minutes > a.bus.minutes && r.taxi.fare > a.taxi.fare, 'mưa kẹt xe, taxi đắt hơn');
assert.ok(!s.walk && !s.bicycle, 'bão chặn đi bộ');
assert.ok(s.bus && s.bus.minutes > r.bus.minutes, 'bão kẹt hơn mưa');
assert.equal(goTo(at(storm), far, 'walk').ok, false);
assert.equal(goTo(at(clear), far, 'walk').ok, true);
const {lifeAction} = require('../.test-build/domain/life');
const {clockOf} = require('../.test-build/domain/time');
const park = d => ({...at(d), health: 60, clock: {...clockOf(g), location: 'park', minute: 480}});
const act = d => lifeAction(park(d), {kind: 'park', activity: 'walk'});
assert.equal(act(storm).ok, false, 'bão đóng công viên');
const ok1 = act(clear), ok2 = act(rain);
assert.ok(ok1.ok && ok2.ok);
assert.ok(ok2.state.mood - park(rain).mood < ok1.state.mood - park(clear).mood, 'mưa công viên kém hiệu quả');
console.log('weather ok');
// ghi chú lý do chậm: giờ cao điểm hoặc thời tiết
{const {clockOf}=require('../.test-build/domain/time');
 let sunny=0,rainy=0;for(let d=1;d<400&&(!sunny||!rainy);d++){const w=weatherOf(d);if(w==='sunny'&&!sunny)sunny=d;if(w==='rain'&&!rainy)rainy=d}
 const at=(day,minute)=>{const s=engine.initial();return{...s,day,clock:{...clockOf(s),minute,location:'home'}}};
 const bus=(s)=>travelOptions(s,'home','office').find(o=>o.mode==='bus');
 assert.equal(bus(at(sunny,480)).note,'Giờ cao điểm');
 assert.equal(bus(at(sunny,600)).note,undefined,'giờ vắng, trời đẹp thì không ghi chú');
 assert.equal(bus(at(rainy,600)).note,'Trời mưa');
 assert.equal(bus(at(rainy,480)).note,'Giờ cao điểm, trời mưa');
 assert.equal(travelOptions(at(sunny,480),'home','office').find(o=>o.mode==='walk').note,undefined,'đi bộ không bị cao điểm');
 console.log('travel note ok');}
