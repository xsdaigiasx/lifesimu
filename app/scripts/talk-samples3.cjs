/* H7a: in 30 câu mẫu Lô 3 (NPC ngẫu nhiên: kiểu người, mạch chuyện, nhớ lần gặp trước) để chủ dự án duyệt. Chạy sau khi build test: node scripts/talk-samples3.cjs [seed] */
const C=require('../.test-build/domain/talk/compose'),N=require('../.test-build/domain/npc'),T=require('../.test-build/domain/town-data');
const world=process.argv[2]||'mau-h7a';
const who={};T.ARCHES.forEach((a,i)=>{who[a.id]=N.personFor(world,'town-'+'ghijklg'[i],{gen:1+i,k:0,since:0,a:a.id})});
const beat=(arc,id)=>{const a=T.ARCS.find(x=>x.id===arc);for(const b of a.beats){if(b.id===id)return b;if(b.alt&&b.alt[1].id===id)return b.alt[1]}};
const af=(n,arc,id)=>{const b=beat(arc,id);return{id:`a-${arc}-${id}`,topic:'self',sub:T.arcSub(arc,id),about:n.id,day:8,tone:b.tone,private:0,knownBy:[n.id],vars:{doing:b.doing,now:b.now,where:'x'}}};
const mf=(n,sub,vars,day=3)=>({id:'m-'+sub,topic:['met','back'].includes(sub)?'player':'self',sub,about:n.id,day,tone:vars.tone??'plain',private:0,knownBy:[n.id],vars:{where:T.archOf(n.arch).where,...vars}});
const wf=(sub,vars)=>({id:'w-'+sub,topic:'world',sub,about:'world',day:10,tone:'bad',private:0,knownBy:'all',vars});
const pf=(sub,vars={})=>({id:'p-'+sub,topic:'player',sub,about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars});
const mood={good:'happy',bad:'tired',plain:'neutral'};
/* [kiểu người, độ thân, cảm xúc, ý định, dữ kiện] */
const S=[
 ['tenant','stranger','tired','complain',n=>[af(n,'lenpho','hoso')]],
 ['tenant','stranger','happy','brag',n=>[af(n,'lenpho','coviec')]],
 ['tenant','acquaint','neutral','request',()=>[]],
 ['tenant','stranger','happy','brag',n=>[mf(n,'metnew',{then:beat('lenpho','phongvan').doing,now:beat('lenpho','coviec').now,tone:'good'})]],
 ['student','stranger','tired','complain',n=>[af(n,'onthi','on')]],
 ['student','acquaint','sad','complain',n=>[af(n,'onthi','rot')]],
 ['student','acquaint','neutral','request',()=>[]],
 ['student','stranger','tired','complain',n=>[mf(n,'metsame',{then:beat('onthi','on').doing})]],
 ['shopper','stranger','neutral','complain',()=>[wf('rain',{weather:'mưa'})]],
 ['shopper','stranger','happy','brag',n=>[af(n,'trongrau','thu')]],
 ['shopper','acquaint','neutral','request',()=>[]],
 ['shopper','stranger','neutral','ask',n=>[mf(n,'met',{},2)]],
 ['diner','stranger','neutral','brag',n=>[af(n,'moquan','gomtien')]],
 ['diner','acquaint','tired','complain',n=>[af(n,'moquan','vang')]],
 ['diner','close','happy','tease',()=>[pf('eatout')]],
 ['diner','acquaint','happy','invite',()=>[wf('weekend',{})]],
 ['jogger','stranger','happy','brag',n=>[af(n,'giaichay','dangky')]],
 ['jogger','acquaint','tired','complain',n=>[af(n,'giaichay','chan')]],
 ['jogger','acquaint','happy','invite',()=>[wf('weekend',{})]],
 ['jogger','stranger','tired','complain',n=>[mf(n,'metnew',{then:beat('giaichay','tangcu').doing,now:beat('giaichay','chan').now,tone:'bad'})]],
 ['dog','stranger','tired','complain',n=>[af(n,'nuoicho','phado')]],
 ['dog','stranger','happy','brag',n=>[af(n,'nuoicho','ngoan')]],
 ['dog','acquaint','neutral','request',()=>[]],
 ['dog','stranger','neutral','ask',n=>[mf(n,'back',{},20)]],
 ['chess','stranger','happy','brag',n=>[af(n,'trongchau','len')]],
 ['chess','stranger','sad','complain',n=>[af(n,'huyetap','cao')]],
 ['chess','acquaint','happy','invite',()=>[wf('weekend',{})]],
 ['chess','close','happy','tease',()=>[pf('fit')]],
 ['chess','stranger','neutral','ask',n=>[mf(n,'met',{},5)]],
 ['diner','stranger','happy','brag',n=>[mf(n,'metnew',{then:beat('moquan','matbang').doing,now:beat('moquan','khaitruong').now,tone:'good'})]],
];
const TV={bestie:'Tri kỷ',close:'Thân',acquaint:'Quen biết',stranger:'Lạ'},IV={ask:'Hỏi',complain:'Than',brag:'Khoe',tease:'Trêu',request:'Nhờ',news:'Kể tin',invite:'Rủ',apologize:'Xin lỗi'};
S.forEach(([arch,tier,m,intent,facts],i)=>{const npc=who[arch],a=T.archOf(arch);
 const said=C.compose({npc,tier,mood:m,channel:'face',minute:a.sched[0][0].from+20,place:a.place,day:10,seed:'h7a-'+i,facts:facts(npc),intents:[intent]});
 const note=facts(npc).map(f=>f.sub).join(' ')||'không có chuyện riêng';
 console.log(`${i+1}|${npc.name} (${a.role}, ${npc.age} tuổi)|${TV[tier]}, ${IV[intent]}, ${note}|${said?.text??'(không ghép được)'}`)});
