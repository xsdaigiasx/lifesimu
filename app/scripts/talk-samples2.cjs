/* H6: in 30 câu mẫu Lô 2 (7 người, câu đáp tiếp lượt sau, câu đáp chủ đề người chơi mở) để chủ dự án duyệt. Chạy sau khi build test: node scripts/talk-samples2.cjs [seed] */
const C=require('../.test-build/domain/talk/compose'),N=require('../.test-build/domain/npc'),R2=require('../.test-build/domain/talk/replies');
const R=N.buildRoster(process.argv[2]||'mau-h6'),by=id=>R.find(n=>n.id===id);
const pf=(sub,vars={},o={})=>({id:'p-'+sub,topic:'player',sub,about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars,...o});
const sf=(id,sub,vars={},o={})=>({id:'s-'+sub,topic:'self',sub,about:id,day:8,tone:'bad',private:0,knownBy:[id],vars,...o});
const wf=(sub,vars)=>({id:'w-'+sub,topic:'world',sub,about:'world',day:10,tone:'bad',private:0,knownBy:'all',vars});
const place={neighbor:'home',meat:'market',grocery:'market',banhmi:'streetfood'};
/* [người, độ thân, cảm xúc, ý định, dữ kiện] câu NPC tự nói; ['follow', người, ý định, sau, dữ kiện]; ['topic', người, độ thân, chủ đề, dữ kiện] */
const S=[
 ['neighbor','acquaint','sad','complain',[sf('neighbor','mood')]],
 ['neighbor','stranger','neutral','ask',[pf('home',{place:'phòng trọ'})]],
 ['neighbor','close','happy','brag',[sf('neighbor','family',{},{tone:'good'})]],
 ['neighbor','acquaint','neutral','request',[]],
 ['meat','stranger','happy','brag',[sf('meat','money',{},{tone:'good'})]],
 ['meat','acquaint','tired','complain',[sf('meat','family')]],
 ['meat','acquaint','neutral','news',[wf('rain',{weather:'mưa'})]],
 ['grocery','stranger','sad','complain',[sf('grocery','money')]],
 ['grocery','acquaint','neutral','request',[]],
 ['grocery','acquaint','neutral','news',[wf('holiday',{holiday:'Tết'})]],
 ['banhmi','stranger','neutral','ask',[pf('food',{dish:'bánh mì ốp la'})]],
 ['banhmi','acquaint','excited','brag',[sf('banhmi','buy',{item:'xe máy mới'},{tone:'good'})]],
 ['banhmi','close','happy','tease',[pf('eatout')]],
 ['sen-pm','acquaint','annoyed','complain',[sf('sen-pm','work')]],
 ['sen-pm','acquaint','neutral','ask',[pf('probation')]],
 ['sen-pm','close','neutral','request',[]],
 ['sen-design','acquaint','tired','complain',[sf('sen-design','work')]],
 ['sen-design','close','happy','invite',[wf('weekend',{})]],
 ['sen-qa','acquaint','neutral','ask',[pf('fit')]],
 ['sen-qa','close','happy','tease',[pf('tired')]],
 ['follow','neighbor','complain','ask',sf('neighbor','sick')],
 ['follow','meat','request','help',undefined],
 ['follow','sen-pm','ask','share',undefined],
 ['follow','grocery','complain','ask',sf('grocery','money')],
 ['topic','neighbor','acquaint','health',[sf('neighbor','hobby',{},{tone:'good'})]],
 ['topic','meat','stranger','favor',[]],
 ['topic','banhmi','close','favor',[]],
 ['topic','sen-design','acquaint','favor',[]],
 ['topic','sen-qa','acquaint','mine',[pf('study')]],
 ['topic','grocery','acquaint','theirs',[]],
];
const TV={bestie:'Tri kỷ',close:'Thân',acquaint:'Quen biết',stranger:'Lạ'},IV={ask:'Hỏi',complain:'Than',brag:'Khoe',tease:'Trêu',request:'Nhờ',news:'Kể tin',invite:'Rủ',apologize:'Xin lỗi'},AV={ask:'Hỏi thêm',help:'Giúp',share:'Kể chuyện mình'},PV={health:'Hỏi thăm',mine:'Kể chuyện mình',theirs:'Hỏi chuyện của họ',favor:'Nhờ việc, hỏi hàng'};
const ctx=(npc,tier,mood,facts,seed)=>({npc,tier,mood,channel:'face',minute:place[npc.id]==='home'?960:480,place:place[npc.id]??'office',day:10,seed,facts});
S.forEach((x,i)=>{let head,said;
 if(x[0]==='follow'){const [,id,intent,after,fact]=x,npc=by(id);said=C.followUp(ctx(npc,'acquaint','neutral',fact?[fact]:[],'h6f-'+i),intent,after,fact);head=`${npc.name} (${npc.role})|đáp tiếp: NPC ${IV[intent]}, người chơi ${AV[after]}`}
 else if(x[0]==='topic'){const [,id,tier,t,facts]=x,npc=by(id);said=C.answerTo(ctx(npc,tier,'neutral',facts,'h6t-'+i),t);head=`${npc.name} (${npc.role})|${TV[tier]}, người chơi mở: ${PV[t]}`}
 else{const [id,tier,mood,intent,facts]=x,npc=by(id);said=C.compose({...ctx(npc,tier,mood,facts,'h6-'+i),intents:[intent]});head=`${npc.name} (${npc.role}, ${npc.age} tuổi)|${TV[tier]}, ${mood}, ${said?.intent?IV[said.intent]:'chào'}`}
 console.log(`${i+1}|${head}|${said?.text??'(không ghép được)'}`)});
