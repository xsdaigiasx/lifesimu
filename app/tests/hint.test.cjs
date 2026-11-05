const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../.test-build/domain/director');const L=require('../.test-build/domain/lines');const S=require('../.test-build/domain/social');
const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');const {dateAt}=require('../.test-build/domain/format');
const mon=(()=>{for(let d=0;d<14;d++)if(dateAt(d).getUTCDay()===1)return d})();
const at=(id,score)=>{const s=engine.initial();return{...s,day:mon,clock:{...clockOf(s),minute:600,location:'market'},social:{...S.socialOf(s),relations:{[id]:{score,lastDay:mon-1,minutes:0}},peak:{[id]:score}}}};
test('nearTier: 6 điểm cuối trước Thân và Tri kỷ',()=>{
 for(const [v,w] of [[23,null],[24,'than'],[29,'than'],[30,null],[53,null],[54,'tri-ky'],[59,'tri-ky'],[60,null],[0,null]])assert.equal(S.nearTier(v),w,String(v))});
test('mỗi NPC có chuyện có đúng một câu gợi ý cho mỗi mốc, không để lộ con số',()=>{
 for(const id of ['ba-tu','dev-an','dev-trang','co-hanh','chu-sau']){const ls=L.LINES.filter(l=>l.intent==='hint:'+id);assert.equal(ls.length,2,id);assert.ok(ls.some(l=>l.min===24&&l.max===29)&&ls.some(l=>l.min===54&&l.max===59),id);for(const l of ls)assert.ok(!/\d/.test(l.text),l.text)}});
test('gần mốc, hỏi thăm thường đổi thành câu than nhẹ; ngoài vùng gần mốc thì không',()=>{
 for(const sc of [26,56]){const r=D.startTalk(at('co-hanh',sc),'co-hanh');assert.ok(r.ok,r.error);const p=D.storyOf(r.state).pending;if(p.motif!=='greet')continue;assert.ok(p.line.startsWith('hint:co-hanh'),`${sc}: ${p.line}`)}
 for(const sc of [5,15,40,70]){const r=D.startTalk(at('co-hanh',sc),'co-hanh');assert.ok(r.ok);const p=D.storyOf(r.state).pending;assert.ok(!(p.line||'').startsWith('hint:'),`${sc}: ${p.line}`)}});
test('câu gợi ý không lặp ngay lần chào sau',()=>{
 let s=at('co-hanh',26);const r=D.startTalk(s,'co-hanh');assert.ok(r.ok);s=r.state;const p=D.storyOf(s).pending;if(p.motif!=='greet')return;assert.ok(p.line.startsWith('hint:'));
 const a=D.answerEvent(s,2);assert.ok(a.ok);s={...a.state,clock:{...clockOf(a.state),minute:665}};
 const r2=D.startTalk(s,'co-hanh');assert.ok(r2.ok,r2.error);const p2=D.storyOf(r2.state).pending;assert.ok(!(p2.line||'').startsWith('hint:')||p2.motif!=='greet','lần chào kế tiếp không lặp câu gợi ý')});
