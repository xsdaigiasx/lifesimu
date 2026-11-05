/* H5: in 30 câu mẫu cho 6 người của Lô 1 để chủ dự án duyệt. Chạy sau khi build test: node scripts/talk-samples.cjs [seed] */
const C=require('../.test-build/domain/talk/compose'),N=require('../.test-build/domain/npc');
const R=N.buildRoster(process.argv[2]||'mau-h5'),by=id=>R.find(n=>n.id===id);
const pf=(sub,vars={},o={})=>({id:'p-'+sub,topic:'player',sub,about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars,...o});
const sf=(id,sub,vars={},o={})=>({id:'s-'+sub,topic:'self',sub,about:id,day:8,tone:'bad',private:0,knownBy:[id],vars,...o});
const wf=(sub,vars)=>({id:'w-'+sub,topic:'world',sub,about:'world',day:10,tone:'bad',private:0,knownBy:'all',vars});
const S=[
 ['me','bestie','neutral','call',['ask'],[pf('food',{dish:'mì gói'})]],
 ['me','bestie','sad','call',['ask'],[pf('eatout'),pf('tired')]],
 ['me','bestie','happy','text',['ask'],[pf('tier',{event:'Middle'},{tone:'good'})]],
 ['me','bestie','tired','call',['complain'],[sf('me','family')]],
 ['me','bestie','happy','call',['brag'],[sf('me','buy',{item:'nồi cơm điện mới'},{tone:'good'})]],
 ['em','bestie','tired','text',['complain'],[sf('em','study')]],
 ['em','bestie','happy','text',['tease'],[pf('job',{place:'Sen Code'})]],
 ['em','bestie','excited','text',['brag'],[sf('em','study',{},{tone:'good'})]],
 ['em','bestie','neutral','text',['request'],[sf('em','study')]],
 ['em','bestie','neutral','text',['ask'],[pf('tier',{event:'Middle'})]],
 ['landlord','acquaint','tired','face',['complain'],[sf('landlord','sick',{event:'đau lưng'})]],
 ['landlord','acquaint','neutral','face',['ask'],[pf('rent',{amount:'1.500 nghìn'})]],
 ['landlord','stranger','neutral','face',['news'],[wf('forecast',{weather:'mưa'})]],
 ['landlord','close','neutral','face',['request'],[sf('landlord','sick')]],
 ['landlord','close','happy','face',['brag'],[sf('landlord','home',{},{tone:'plain'})]],
 ['sen-dev','acquaint','tired','face',['complain'],[sf('sen-dev','work')]],
 ['sen-dev','close','happy','face',['tease'],[pf('food',{dish:'cơm tấm'})]],
 ['sen-dev','acquaint','neutral','face',['ask'],[pf('tired')]],
 ['sen-dev','close','excited','face',['invite'],[pf('weekend',{place:'quán bún bò đầu hẻm'},{topic:'world',about:'world'})]],
 ['sen-dev','close','annoyed','face',['request'],[sf('sen-dev','work')]],
 ['veg','stranger','sad','face',['complain'],[sf('veg','money')]],
 ['veg','acquaint','happy','face',['brag'],[sf('veg','money',{},{tone:'good'})]],
 ['veg','acquaint','tired','face',['complain'],[wf('weather',{weather:'mưa'})]],
 ['veg','close','neutral','face',['ask'],[pf('cook',{dish:'canh chua'})]],
 ['veg','acquaint','neutral','face',['ask'],[pf('eatout')]],
 ['courier','acquaint','tired','face',['complain'],[sf('courier','study')]],
 ['courier','close','sad','face',['complain'],[sf('courier','money',{},{private:2})]],
 ['courier','acquaint','happy','face',['ask'],[pf('fit')]],
 ['courier','stranger','neutral','face',['ask'],[pf('home',{place:'phòng trọ'})]],
 ['courier','close','excited','face',['invite'],[pf('weekend',{place:'quán ốc đầu hẻm'},{topic:'world',about:'world'})]],
];
const TV={bestie:'Tri kỷ',close:'Thân',acquaint:'Quen biết',stranger:'Lạ'},MV={happy:'vui',excited:'hào hứng',neutral:'bình thường',tired:'mệt',sad:'buồn',annoyed:'bực'},IV={ask:'Hỏi',complain:'Than',brag:'Khoe',tease:'Trêu',request:'Nhờ',news:'Kể tin',invite:'Rủ'},CV={face:'gặp',text:'nhắn',call:'gọi'};
S.forEach(([id,tier,mood,channel,intents,facts],i)=>{const npc=by(id);const s=C.compose({npc,tier,mood,channel,minute:channel==='face'&&id==='veg'?480:600,place:id==='veg'?'market':undefined,day:10,seed:'h5-'+i,facts,intents});
 console.log(`${i+1}|${npc.name} (${npc.role}, ${npc.age} tuổi, ${npc.voice})|${TV[tier]}, ${MV[mood]}, ${CV[channel]}|${s?.intent?IV[s.intent]:'chào'}|${s?.text}`)});
