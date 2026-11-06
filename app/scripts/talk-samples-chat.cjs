/* H7d: in 30 tin nhóm chat mẫu (đủ loại: chuyện thường, thời tiết, chuyện riêng và câu đáp, tin đồn, giá chợ, thông báo, rủ nhóm) để chủ dự án duyệt.
 * Chạy sau khi build test: node scripts/talk-samples-chat.cjs [số tin] */
const {engine}=require('../.test-build/domain/engine'),C=require('../.test-build/domain/talk/groups'),N=require('../.test-build/domain/npc'),{GROUP_NAME}=require('../.test-build/domain/talk/chat-data'),O=require('../.test-build/domain/office');
const want=Number(process.argv[2]||30),out=[],seen=new Set(),cap={chat:6,self:6,reply:5,rumor:5,news:5,invite:3},kinds={};
for(let w=0;w<40&&out.length<want;w++){let s={...engine.initial(),seed:{world:'chat'+w,life:'l'},office:{...O.initialOffice(),role:'employee',employerId:w%2?'sen-code':'an-nhien-tech'}};
 for(let d=20;d<80&&out.length<want;d++){s=C.settleChats({...s,day:d});for(const g of C.GROUPS)for(const m of (s.chats.msgs[g]??[]).filter(m=>m.day===d)){const k=m.kind;if((kinds[k]??0)>=cap[k]||seen.has(m.text))continue;seen.add(m.text);kinds[k]=(kinds[k]??0)+1;out.push(`[${GROUP_NAME[g]}] ${N.castById(s,m.from)?.name}: ${m.text}`)}}}
out.slice(0,want).forEach((l,i)=>console.log(`${i+1}. ${l}`));console.error(kinds);
