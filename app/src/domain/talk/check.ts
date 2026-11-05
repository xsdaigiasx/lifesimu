/** H1: bộ kiểm tra kho khung và mảnh (HOI-THOAI I.6). Dữ liệu sai thì chặn (npm run talk:check, test). */
import {isNpcId} from '../npc';
import type {Frame,Piece,TalkData} from './types';
import {CHANNELS,EMOTIONS,INTENTS,SLOTS,TIERS,VOICES,WHENS} from './types';
import {ADDRESS_VARS,varsIn} from './compose';

/** Biến điền được phép trong mảnh (lấy từ dữ kiện); `when` tự tính từ ngày của dữ kiện. */
export const FACT_VARS=['dish','place','time','weather','name','amount','item','event','holiday','when'] as const;
const PLACES=['home','office','market','mall','bank','hospital','bus','park','streetfood','restaurant','apartments','villa','lake'];
const slotOf=(s:string)=>s.replace(/\?$/,'');

export function talkProblems(d:TalkData,opt:{minFramesPerIntent?:number}={}):string[]{const out:string[]=[],bad=(m:string)=>out.push(m);
 if(!d||!Array.isArray(d.frames)||!Array.isArray(d.pieces))return['thiếu frames hoặc pieces'];
 const ids=new Set<string>();
 for(const f of d.frames as Frame[]){const at=`khung ${f?.id}`;
  if(!f||typeof f.id!=='string'||!f.id){bad('khung thiếu id');continue}if(ids.has(f.id))bad(`${at}: trùng id`);ids.add(f.id);
  if(!INTENTS.includes(f.intent))bad(`${at}: ý định lạ ${f.intent}`);
  if(!Array.isArray(f.slots)||!f.slots.length)bad(`${at}: không có ô`);else{const ss=f.slots.map(slotOf);
   for(const s of ss)if(!SLOTS.includes(s as never))bad(`${at}: ô lạ ${s}`);
   if(new Set(ss).size!==ss.length)bad(`${at}: hai ô cùng chức năng`);
   if(f.slots.every(s=>s.endsWith('?')))bad(`${at}: cần ít nhất một ô bắt buộc`)}
  if(f.channel&&(!f.channel.length||f.channel.some(c=>!CHANNELS.includes(c))))bad(`${at}: kênh lạ`);
  if(f.weight!==undefined&&!(f.weight>0))bad(`${at}: trọng số phải dương`)}
 const need=opt.minFramesPerIntent??0;if(need)for(const i of INTENTS){const n=d.frames.filter(f=>f.intent===i).length;if(n<need)bad(`ý định ${i}: có ${n} khung, cần ${need}`)}
 const pids=new Set<string>(),texts=new Set<string>();
 for(const p of d.pieces as Piece[]){const at=`mảnh ${p?.id}`;
  if(!p||typeof p.id!=='string'||!p.id){bad('mảnh thiếu id');continue}if(pids.has(p.id))bad(`${at}: trùng id`);pids.add(p.id);
  if(!SLOTS.includes(p.slot))bad(`${at}: ô lạ ${p.slot}`);
  if(typeof p.text!=='string'||!p.text.trim())bad(`${at}: chữ rỗng`);else{
   if(p.text.length>140)bad(`${at}: quá 140 ký tự`);if(/[•·]|\s{2}|^\s|\s$/.test(p.text))bad(`${at}: có dấu • hoặc · hoặc khoảng trắng thừa`);
   if(/[{}]/.test(p.text.replace(/\{[\p{L}_]+\}/gu,'')))bad(`${at}: ngoặc nhọn hở`);
   const key=`${p.slot}|${p.voice??''}|${p.npc??''}|${p.text}`;if(texts.has(key))bad(`${at}: trùng chữ với mảnh khác`);texts.add(key);
   for(const v of varsIn(p.text)){if((ADDRESS_VARS as readonly string[]).includes(v))continue;if(!(FACT_VARS as readonly string[]).includes(v))bad(`${at}: biến lạ {${v}}`);else if(v==='when'?!p.intent:!(p.needs??[]).includes(v))bad(`${at}: dùng {${v}} mà không khai trong needs`)}}
  for(const v of p.needs??[])if(!(FACT_VARS as readonly string[]).includes(v))bad(`${at}: needs có biến lạ ${v}`);
  if(p.intent&&(!p.intent.length||p.intent.some(i=>!INTENTS.includes(i))))bad(`${at}: ý định lạ`);
  if(p.emotion&&(!p.emotion.length||p.emotion.some(e=>!EMOTIONS.includes(e))))bad(`${at}: cảm xúc lạ`);
  if(p.minTier!==undefined&&!TIERS.includes(p.minTier))bad(`${at}: độ thân lạ`);
  if(p.privacy!==undefined&&![0,1,2,3].includes(p.privacy))bad(`${at}: mức riêng tư phải 0 đến 3`);
  if(p.voice!==undefined&&!VOICES.includes(p.voice))bad(`${at}: giọng lạ`);
  if(p.npc!==undefined&&!isNpcId(p.npc))bad(`${at}: mã NPC lạ ${p.npc}`);
  if(p.age!==undefined&&!(Array.isArray(p.age)&&p.age.length===2&&p.age.every(Number.isInteger)&&p.age[0]<=p.age[1]))bad(`${at}: tuổi phải là [từ, đến]`);
  if(p.where&&p.where.some(x=>!PLACES.includes(x)))bad(`${at}: nơi lạ`);
  if(p.when&&p.when.some(x=>!WHENS.includes(x)))bad(`${at}: thời điểm lạ`);
  if(p.channel&&p.channel.some(x=>!CHANNELS.includes(x)))bad(`${at}: kênh lạ`);
  if(p.weight!==undefined&&!(p.weight>0))bad(`${at}: trọng số phải dương`);
  if(p.cold&&p.intent?.some(i=>['invite','request','tease'].includes(i)))bad(`${at}: mảnh lạnh nhạt không dùng cho Rủ, Nhờ, Trêu`);
  // mảnh nào cũng phải có ít nhất một khung dùng được (chào hỏi: ô open không gắn ý định)
  const usable=!p.intent&&p.slot==='open'||d.frames.some(f=>f.slots.map(slotOf).includes(p.slot)&&(!p.intent||p.intent.includes(f.intent))&&(!p.channel||!f.channel||p.channel.some(c=>f.channel!.includes(c))));
  if(!usable)bad(`${at}: không khung nào dùng được`)}
 // khung nào cũng phải có mảnh cho mọi ô bắt buộc
 for(const f of d.frames)for(const s of f.slots.filter(x=>!x.endsWith('?')))if(!d.pieces.some(p=>p.slot===s&&(!p.intent||p.intent.includes(f.intent))&&!p.cold))bad(`khung ${f.id}: ô ${s} không có mảnh nào`);
 return out}
