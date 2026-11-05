/** H1: điều kiện khống chế của 6 trục (HOI-THOAI I.3). Hàm thuần, không đọc save. */
import type {Channel,Emotion,Intent,Tier,TopicGroup,When,Fact} from './types';

/** Trục 4: điểm quan hệ ra độ thân; `hostile` khi có cờ Bất hoà (T40). */
export const tierOf=(score:number,hostile=false):Tier=>hostile?'hostile':score>=60?'bestie':score>=30?'close':score>=10?'acquaint':'stranger';
export const tierRank=(t:Tier)=>({hostile:0,stranger:1,acquaint:2,close:3,bestie:4} as const)[t];
/** Mức riêng tư tối đa được dùng theo độ thân: Lạ 0, Quen biết 1, Thân 2, Tri kỷ 3, Bất hoà 0. */
export const privacyCap=(t:Tier)=>({hostile:0,stranger:0,acquaint:1,close:2,bestie:3} as const)[t];
/** Trục 6: thời điểm theo phút trong ngày (khuya từ 22:00). */
export const whenOf=(minute:number):When=>minute>=1320||minute<300?'late':minute<660?'morning':minute<780?'noon':minute<1080?'afternoon':'evening';
/** Trục 6: có được nói qua kênh này lúc này không. Khuya chỉ nhắn tin, từ Thân, người từ 60 tuổi không nhắn khuya. Gọi điện từ Thân (người thân luôn được). */
export function channelAllowed(ch:Channel,when:When,tier:Tier,age:number,family=false){
 if(when==='late'&&(ch!=='text'||(!family&&tierRank(tier)<3)||age>=60))return false;
 if(ch==='call'&&!family&&tierRank(tier)<3)return false;
 return true}

/** Trục 1: độ thân tối thiểu của ý định; Bất hoà không Rủ, không Nhờ, không Trêu. */
export const INTENT_MIN_TIER:Record<Intent,Tier>={brag:'stranger',complain:'stranger',ask:'stranger',invite:'acquaint',request:'acquaint',news:'stranger',tease:'close',apologize:'stranger'};
const NO_HOSTILE:Intent[]=['invite','request','tease'];
/** Trục 1 và 3: ý định hợp cảm xúc (Khoe không đi với Buồn, Bực; Trêu không đi với Bực). */
const MOOD_BAN:Partial<Record<Intent,Emotion[]>>={brag:['sad','annoyed'],tease:['annoyed']};
export function intentAllowed(i:Intent,tier:Tier,mood:Emotion){
 if(tier==='hostile')return!NO_HOSTILE.includes(i);
 return tierRank(tier)>=tierRank(INTENT_MIN_TIER[i])&&!(MOOD_BAN[i]??[]).includes(mood)}
/** Bảng tương thích ý định và nhóm chủ đề (Xin lỗi chỉ về người chơi; Kể tin không về bản thân NPC). */
export const INTENT_TOPICS:Record<Intent,TopicGroup[]>={brag:['self'],complain:['self','world','other'],ask:['player','other','world'],invite:['player','world','self'],request:['self'],news:['world','other'],tease:['player','self'],apologize:['player']};
/** NPC có được biết dữ kiện này không: mọi người, người có mặt hôm đó, hoặc danh sách. */
export function canKnow(f:Fact,npc:string,present:readonly string[]=[]){return f.knownBy==='all'||(f.knownBy==='present'?present.includes(npc):f.knownBy.includes(npc))}
/** Dữ kiện dùng được cho ý định: đúng nhóm chủ đề, đủ độ thân về riêng tư, NPC được biết, chuyện của người khác thì không phải chính NPC. */
export function factFits(f:Fact,i:Intent,tier:Tier,npc:string,present:readonly string[]=[]){
 if(!INTENT_TOPICS[i].includes(f.topic)||f.private>privacyCap(tier)||!canKnow(f,npc,present))return false;
 if(f.topic==='self')return f.about===npc;if(f.topic==='other')return f.about!==npc&&f.about!=='player';return true}
