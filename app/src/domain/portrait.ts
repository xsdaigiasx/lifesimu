/** Chân dung NPC ghép từ mảnh (Codex #305, HOI-THOAI I.5c): nền (giới, tuổi, da), áo theo vai, tóc, phụ kiện.
 * Từ H0 mỗi đời chơi rút người ngẫu nhiên cho từng vai nên ảnh vẽ sẵn theo vai không còn khớp; chân dung tính lại từ hồ sơ, tất định theo người (không lưu save).
 * Bảng mảnh dưới đây khớp `public/assets/portrait/manifest.json` (test kiểm). */
import type {NpcProfile} from './npc';
import {hash} from './shift';

export type AgeBand='teen'|'adult'|'mid'|'old';
type G='m'|'f'|'any';
interface Part{id:string;g:G;ages:AgeBand[];grey?:boolean}
const ALL:AgeBand[]=['teen','adult','mid','old'];
export const PORTRAIT_DIR='/assets/portrait';
export const SKINS=['light','mid','tan'] as const;
export const OUTFITS:Part[]=[{id:'tee',g:'any',ages:ALL},{id:'shirt',g:'any',ages:ALL},{id:'polo',g:'any',ages:ALL},{id:'hoodie',g:'any',ages:['teen','adult']},{id:'blouse-doctor',g:'any',ages:['adult','mid','old']},{id:'guard',g:'any',ages:['adult','mid','old']},{id:'apron',g:'any',ages:['adult','mid','old']},{id:'ba-ba',g:'any',ages:['adult','mid','old']},{id:'cardigan',g:'any',ages:['mid','old']},{id:'office-f',g:'f',ages:['adult','mid','old']}];
export const HAIRS:Part[]=[{id:'m-crop',g:'m',ages:['teen','adult','mid']},{id:'m-sidepart',g:'m',ages:['adult','mid']},{id:'m-wavy',g:'m',ages:['teen','adult']},{id:'m-fringe',g:'m',ages:['teen','adult']},{id:'m-buzz',g:'m',ages:['adult','mid']},{id:'m-thinning',g:'m',ages:['mid','old'],grey:true},{id:'m-silver-sidepart',g:'m',ages:['old'],grey:true},{id:'m-silver-crop',g:'m',ages:['old'],grey:true},
 {id:'f-bob',g:'f',ages:['teen','adult','mid']},{id:'f-bun',g:'f',ages:['teen','adult','mid']},{id:'f-pixie',g:'f',ages:['adult','mid']},{id:'f-fringe',g:'f',ages:['teen','adult']},{id:'f-waves',g:'f',ages:['teen','adult']},{id:'f-updo',g:'f',ages:['adult','mid']},{id:'f-silver-bob',g:'f',ages:['old'],grey:true},{id:'f-silver-bun',g:'f',ages:['old'],grey:true}];
export const EXTRAS:Part[]=[{id:'glasses-round',g:'any',ages:ALL},{id:'glasses-square',g:'any',ages:ALL},{id:'cap',g:'any',ages:ALL},{id:'mustache',g:'m',ages:['adult','mid','old']},{id:'beard-short',g:'m',ages:['adult','mid']},{id:'beard-grey',g:'m',ages:['mid','old']},{id:'earrings',g:'f',ages:ALL},{id:'hairclip',g:'f',ages:ALL}];

/** Phụ kiện đang chờ vẽ lại (lệch mặt, sai dáng): không rút cho NPC. */
export const REDRAW:readonly string[]=['beard-short','beard-grey','hairclip'];
/** Kiểu tóc để lộ tai (đeo bông tai được). */
export const EAR_HAIRS:readonly string[]=['f-bun','f-updo','f-pixie','f-silver-bun'];
export const ageBand=(age:number):AgeBand=>age<22?'teen':age<40?'adult':age<60?'mid':'old';
/** Áo hợp vai (mã vai, hoặc chỗ ngồi của đồng nghiệp); vai lạ mặc áo thường. */
const ROLE_OUTFIT:Record<string,string[]>={
 me:['ba-ba','cardigan','tee'],em:['tee','hoodie','polo'],landlord:['shirt','polo','cardigan'],neighbor:['cardigan','ba-ba','tee'],
 veg:['apron','ba-ba'],meat:['apron','tee'],grocery:['ba-ba','apron','cardigan'],banhmi:['apron','tee'],courier:['hoodie','tee','polo'],
 doctor:['blouse-doctor'],teller:['office-f','shirt'],reception:['office-f','shirt'],leasing:['shirt','office-f'],recruiter:['office-f','shirt','polo'],tech:['guard','polo'],
 dev:['tee','hoodie','polo','shirt'],design:['tee','hoodie','shirt'],qa:['polo','tee','shirt'],pm:['shirt','office-f','polo'],
 /* H7a: NPC ngẫu nhiên theo kiểu người */
 tenant:['tee','shirt','polo'],student:['tee','hoodie'],shopper:['ba-ba','cardigan','shirt'],diner:['shirt','polo','tee','office-f'],jogger:['tee','polo'],dog:['tee','hoodie','cardigan'],chess:['cardigan','ba-ba','polo']};
const fits=(p:Part,g:'m'|'f',a:AgeBand)=>(p.g==='any'||p.g===g)&&p.ages.includes(a);
const pick=<T,>(list:readonly T[],key:string)=>list[hash(key)%list.length]!;

export interface Face{base:string;outfit:string;hair:string;extras:string[]}
/** Mặt của một người: tất định theo người (mã vai cộng họ tên), đổi người thì đổi mặt. */
export function faceOf(n:Pick<NpcProfile,'id'|'gender'|'age'|'quirk'|'fullName'>&{desk?:string;arch?:string}):Face{
 const g=n.gender==='female'?'f':'m',a=ageBand(n.age),k=`face:${n.id}:${n.fullName}`,roll=(x:string)=>hash(`${k}:${x}`)%100;
 const base=`${g}-${a}-${pick(SKINS,`${k}:skin`)}`;
 const wanted=ROLE_OUTFIT[n.desk??n.arch??n.id]??ROLE_OUTFIT[n.id.replace(/^.*-/,'')]??['tee','shirt','polo'];
 const outs=wanted.filter(id=>{const p=OUTFITS.find(o=>o.id===id);return!!p&&fits(p,g,a)});const outfit=outs.length?pick(outs,`${k}:outfit`):'tee';
 // tóc: người già tóc bạc; trung niên 30% bạc (nam tóc thưa)
 const hairs=HAIRS.filter(h=>fits(h,g,a)),grey=a==='old'||(a==='mid'&&roll('grey')<30),hp=hairs.filter(h=>!!h.grey===grey);const hair=pick(hp.length?hp:hairs,`${k}:hair`).id;
 const extras:string[]=[];
 if(n.quirk==='Luôn đội mũ lưỡi trai')extras.push('cap');
 if(roll('glasses')<(a==='old'?40:a==='mid'?30:20))extras.push(roll('gl-kind')<50?'glasses-round':'glasses-square');
 /* 06/11 (chủ dự án: phụ kiện chưa chuẩn): râu quai nón, râu bạc, kẹp tóc chờ Codex vẽ lại (REDRAW) nên tạm không dùng; còn ria mép */
 if(g==='m'&&a!=='teen'&&roll('beard')<25){const b=EXTRAS.filter(e=>['mustache','beard-short','beard-grey'].includes(e.id)&&!REDRAW.includes(e.id)&&fits(e,g,a));if(b.length)extras.push(pick(b,`${k}:beard`).id)}
 /* bông tai chỉ khi tóc để lộ tai (búi, vấn, tóc ngắn); tóc che tai thì bông tai nằm đè lên tóc */
 if(g==='f'){if(EAR_HAIRS.includes(hair)&&roll('ear')<35)extras.push('earrings');if(!extras.includes('cap')&&!REDRAW.includes('hairclip')&&roll('clip')<15)extras.push('hairclip')}
 return{base,outfit,hair,extras:extras.slice(0,2)}}
/** Chỉnh vị trí lớp phụ kiện trên khung 256 px (dx, dy tính px, scale nhân), khớp `adjust` trong manifest (test kiểm). Mũ lưỡi trai vẽ nổi trên đầu nên hạ 22 px (vành sát chân mày); kính hạ 4 px cho tròng kính ngang mắt (soi ảnh ghép 06/11). */
export const EXTRA_ADJUST:Record<string,{dx:number;dy:number;scale:number}>={cap:{dx:0,dy:22,scale:1},'glasses-round':{dx:0,dy:4,scale:1},'glasses-square':{dx:0,dy:4,scale:1}};
export const FRAME=256;
/** Độ chỉnh của một lớp theo tên ảnh (`.../extra/cap.webp`), không có thì không chỉnh. */
export const layerAdjust=(src:string)=>{const m=/\/extra\/([^/]+)\.webp$/.exec(src);return m?EXTRA_ADJUST[m[1]!]:undefined};
/** Đường dẫn các lớp theo thứ tự chồng (nền, áo, tóc, phụ kiện). */
export const faceLayers=(f:Face)=>[`base/${f.base}`,`outfit/${f.outfit}`,`hair/${f.hair}`,...f.extras.map(x=>`extra/${x}`)].map(p=>`${PORTRAIT_DIR}/${p}.webp`);
