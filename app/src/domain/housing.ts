/** Nhà ở (chủ dự án duyệt 04/11): phòng trọ, nhà phố (thuê hoặc mua), biệt thự (mua). Nhà lớn chia nhiều phòng,
 * mỗi tầng một mặt bằng liền, các phòng nối nhau; mỗi phòng một công dụng. Nội thất đã mua mang theo khi chuyển nhà. */
import type {GameState,GameResult,PlaceId} from './types';
import {HOME_ITEMS,homeOf,type HomeId} from './home';
import {clockOf,spendTime} from './time';
import {post} from './money';
import {recordJournal} from './journal';

export type HouseId='tro'|'townhouse'|'villa';
export type RoomUse='living'|'kitchen'|'bedroom'|'study'|'bath'|'guest'|'fun'|'garden';
/** Phòng là một vùng trên mặt bằng của tầng (toạ độ ô). Ô không thuộc phòng nào là hành lang, cầu thang. */
export interface RoomDef{id:RoomUse;name:string;x:number;y:number;w:number;h:number}
export interface FloorDef{id:1|2;w:number;h:number;rooms:RoomDef[];stairs?:{x:number;y:number;w:number;h:number}}
export interface HouseDef{name:string;place:PlaceId;rent?:number;price?:number;sleep:{energy:number;stress:number};floors:FloorDef[]}
const R=(id:RoomUse,name:string,x:number,y:number,w:number,h:number):RoomDef=>({id,name,x,y,w,h});
/** Mỗi tầng một mặt bằng liền; các phòng nối nhau qua cửa và hành lang (chốt 04/11). */
export const HOUSES:Record<HouseId,HouseDef>={
 tro:{name:'Phòng trọ',place:'home',sleep:{energy:0,stress:0},floors:[]},
 townhouse:{name:'Nhà phố',place:'apartments',rent:6000000,price:2500000000,sleep:{energy:6,stress:2},floors:[
  {id:1,w:18,h:12,rooms:[R('living','Phòng khách',0,0,10,10),R('kitchen','Bếp',10,0,8,8)],stairs:{x:14,y:8,w:4,h:4}},
  {id:2,w:18,h:12,rooms:[R('bedroom','Phòng ngủ',0,0,10,10),R('study','Phòng làm việc',10,0,8,8),R('bath','Phòng tắm',14,8,4,4)],stairs:{x:10,y:8,w:4,h:4}}]},
 villa:{name:'Biệt thự',place:'villa',price:12000000000,sleep:{energy:10,stress:4},floors:[
  {id:1,w:30,h:30,rooms:[R('living','Phòng khách',0,0,10,10),R('kitchen','Bếp',10,0,8,8),R('bath','Phòng tắm',10,8,6,6),R('fun','Phòng giải trí',18,0,12,12),R('garden','Sân vườn',7,14,16,16)],stairs:{x:0,y:10,w:4,h:4}},
  {id:2,w:28,h:14,rooms:[R('bedroom','Phòng ngủ',0,0,10,10),R('guest','Phòng ngủ phụ',10,0,10,10),R('study','Phòng làm việc',20,0,8,8)],stairs:{x:0,y:10,w:4,h:4}}]},
};
export const roomsOf=(house:HouseId)=>HOUSES[house].floors.flatMap(f=>f.rooms);
export const HOUSE_IDS=Object.keys(HOUSES) as HouseId[];
/** Công dụng từng phòng: bếp nấu nhanh hơn, phòng làm việc tự học thêm XP, giải trí và sân vườn để thư giãn. */
export const COOK_FACTOR=.8,STUDY_FACTOR=1.25,MOVE_MINUTES=120;
export const RELAX={fun:{name:'Chơi game',minutes:45,mood:10,stress:-12,energy:-2},garden:{name:'Ra vườn',minutes:30,mood:8,stress:-10,energy:4}} as const;

export type Rotation=0|90|180|270;
export const ROTATIONS:Rotation[]=[0,90,180,270];
export interface Placed{id:HomeId;x:number;y:number;rotation:Rotation}
export interface HousingState{version:1;house:HouseId;tenure:'rent'|'own';owned:HouseId[];layouts:Partial<Record<HouseId,Partial<Record<'1'|'2',Placed[]>>>>;relax?:Partial<Record<'fun'|'garden',number>>}
export const housingOf=(s:GameState):HousingState=>s.housing??{version:1,house:'tro',tenure:'rent',owned:[],layouts:{}};
export const houseOf=(s:GameState)=>HOUSES[housingOf(s).house];
/** Nơi ở hiện tại trên bản đồ: ngủ, nấu ăn, sắp xếp đồ đều làm ở đây. */
export const residenceOf=(s:GameState):PlaceId=>houseOf(s).place;
export const atResidence=(s:GameState)=>clockOf(s).location===residenceOf(s);
export const hasRoom=(s:GameState,use:RoomUse)=>roomsOf(housingOf(s).house).some(r=>r.id===use);
/** Tiền nhà mỗi tháng: trọ của Bà Tư, nhà phố thuê, nhà đã mua thì không. */
export function monthlyRent(s:GameState,base:number){const h=housingOf(s);if(h.house==='tro')return base;if(h.tenure==='own')return 0;return HOUSES[h.house].rent??0}
export const rentLabel=(s:GameState)=>housingOf(s).house==='tro'?'Tiền trọ':'Tiền thuê nhà';

/** Kích thước đồ trên lưới (theo hướng xoay). */
export const itemSize=(p:Placed)=>{const t=HOME_ITEMS[p.id];return p.rotation%180?{w:t.h,h:t.w}:{w:t.w,h:t.h}};
export function layoutOf(s:GameState,house:HouseId,floor:1|2):Placed[]{return housingOf(s).layouts[house]?.[String(floor) as '1'|'2']??[]}
/** Đồ đã mua nhưng chưa đặt ở tầng nào của nhà này. */
export function storageOf(s:GameState,house:HouseId):HomeId[]{const used=new Set(Object.values(housingOf(s).layouts[house]??{}).flat().map(p=>p.id));return [...new Set(homeOf(s).items.map(i=>i.id))].filter(id=>!used.has(id))}
const inside=(r:{x:number;y:number;w:number;h:number},x:number,y:number,w=1,h=1)=>x>=r.x&&y>=r.y&&x+w<=r.x+r.w&&y+h<=r.y+r.h;
/** Phòng chứa trọn món đồ (đồ phải nằm gọn trong một phòng, không đặt ở hành lang, cầu thang). */
export function roomAt(floor:FloorDef,p:Placed){const {w,h}=itemSize(p);return floor.rooms.find(r=>inside(r,p.x,p.y,w,h))}
export const roomOfCell=(floor:FloorDef,x:number,y:number)=>floor.rooms.find(r=>inside(r,x,y));
export function placeError(floor:FloorDef,items:Placed[]):string|null{const cells=new Set<string>();for(const p of items){const {w,h}=itemSize(p);if(!roomAt(floor,p))return'Đồ phải nằm gọn trong một phòng.';for(let x=p.x;x<p.x+w;x++)for(let y=p.y;y<p.y+h;y++){const k=x+':'+y;if(cells.has(k))return'Đồ bị chồng lên nhau.';cells.add(k)}}return null}

/** Lưu cách bày một tầng của nhà đang ở. */
export function arrangeFloor(s:GameState,floor:1|2,items:Placed[]):GameResult{const h=housingOf(s);if(h.house==='tro')return{ok:false,error:'Phòng trọ sắp xếp trong Nhà của tôi.'};if(!atResidence(s)||s.work?.active)return{ok:false,error:'Hãy về nhà để sắp xếp.'};
 const def=HOUSES[h.house].floors.find(f=>f.id===floor);if(!def)return{ok:false,error:'Nhà không có tầng này.'};const owned=new Set(homeOf(s).items.map(i=>i.id));
 if(items.length>30||!items.every(p=>owned.has(p.id)&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&ROTATIONS.includes(p.rotation)))return{ok:false,error:'Đồ chưa hợp lệ.'};if(new Set(items.map(p=>p.id)).size!==items.length)return{ok:false,error:'Mỗi món chỉ đặt một chỗ.'};
 const key=String(floor) as '1'|'2',others=Object.entries(h.layouts[h.house]??{}).filter(([k])=>k!==key).flatMap(([,v])=>v??[]);if(items.some(p=>others.some(o=>o.id===p.id)))return{ok:false,error:'Món này đang ở tầng khác.'};
 const err=placeError(def,items);if(err)return{ok:false,error:err};
 if(items.some(p=>p.id==='bed'&&!['bedroom','guest'].includes(roomAt(def,p)!.id)))return{ok:false,error:'Giường đặt ở phòng ngủ.'};
 return{ok:true,state:{...s,housing:{...h,layouts:{...h.layouts,[h.house]:{...h.layouts[h.house],[key]:items}}}}}}

/** Thuê hoặc mua nhà, chuyển tới ở ngay (mất 2 giờ dọn đồ). Về lại phòng trọ thì miễn phí. */
export function moveHouse(s:GameState,house:HouseId,tenure:'rent'|'own'):GameResult{const h=housingOf(s),def=HOUSES[house];if(!def)return{ok:false,error:'Nhà không hợp lệ.'};if(s.work?.active)return{ok:false,error:'Hãy dừng ca làm trước.'};
 if(house!=='tro'&&clockOf(s).location!==def.place)return{ok:false,error:'Hãy đến xem nhà trước.'};if(h.house===house&&(h.tenure===tenure||house==='tro'))return{ok:false,error:'Bạn đang ở đây rồi.'};
 const owns=h.owned.includes(house);let cost=0,label='';
 if(house!=='tro'&&!owns){if(tenure==='own'){if(!def.price)return{ok:false,error:'Nhà này không bán.'};cost=def.price;label=`Mua ${def.name}`}else{if(!def.rent)return{ok:false,error:'Nhà này không cho thuê.'};cost=def.rent;label=`Tiền thuê ${def.name} tháng đầu`}}
 if(s.money<cost)return{ok:false,error:'Chưa đủ tiền.'};const t=spendTime(s,MOVE_MINUTES);if(!t.ok)return t;const n=structuredClone(t.state);
 if(cost&&post(n,{name:label,amount:-cost})!=='ok')return{ok:false,error:'Chưa đủ tiền.'};
 const final=house==='tro'?'rent':owns?'own':tenure;n.housing={...h,house,tenure:final,owned:final==='own'&&!owns?[...h.owned,house]:h.owned,layouts:{...h.layouts}};
 if(house!=='tro'&&!n.housing.layouts[house])n.housing.layouts[house]=autoLayout(n,house);
 n.clock={...clockOf(n),location:def.place};
 return{ok:true,state:recordJournal(n,`move:${s.day}:${house}`,`Chuyển tới ${def.name}`,final==='own'&&!owns?'Căn nhà của riêng mình.':house==='tro'?'Về lại phòng trọ cũ.':'Thuê theo tháng.')}}

/** Lần đầu dọn vào: giường vào góc phòng ngủ, bàn vào phòng làm việc, còn lại để kho. */
function autoLayout(s:GameState,house:HouseId):Partial<Record<'1'|'2',Placed[]>>{const ids=homeOf(s).items.map(i=>i.id),out:Partial<Record<'1'|'2',Placed[]>>={};const put=(room:RoomUse,id:HomeId,dx:number,dy:number)=>{if(!ids.includes(id))return;for(const f of HOUSES[house].floors){const r=f.rooms.find(x=>x.id===room);if(r){(out[String(f.id) as '1'|'2']??=[]).push({id,x:r.x+dx,y:r.y+dy,rotation:0});return}}};
 put('bedroom','bed',1,1);put('bedroom','wardrobe',5,0);put('study','desk',1,1);return out}

/** Thư giãn ở phòng giải trí hoặc sân vườn, mỗi nơi một lần mỗi ngày. */
export function relaxAtHome(s:GameState,kind:'fun'|'garden'):GameResult{if(!hasRoom(s,kind)||!atResidence(s))return{ok:false,error:'Nhà chưa có phòng này.'};const h=housingOf(s);if(h.relax?.[kind]===s.day)return{ok:false,error:'Hôm nay đã thư giãn ở đây rồi.'};const r=RELAX[kind],t=spendTime(s,r.minutes);if(!t.ok)return t;const n=structuredClone(t.state),c=(v:number)=>Math.max(0,Math.min(100,Math.round(v)));
 n.mood=c(n.mood+r.mood);n.stress=c(n.stress+r.stress);n.energy=c(n.energy+r.energy);n.housing={...h,relax:{...h.relax,[kind]:s.day}};return{ok:true,state:n}}

export function validHousing(v:unknown,day:number):v is HousingState{if(!v||typeof v!=='object')return false;const h=v as HousingState;if(h.version!==1||!HOUSE_IDS.includes(h.house)||!['rent','own'].includes(h.tenure)||!Array.isArray(h.owned)||!h.owned.every(x=>HOUSE_IDS.includes(x)&&x!=='tro'))return false;
 if(h.tenure==='own'&&h.house!=='tro'&&!h.owned.includes(h.house))return false;if(!h.layouts||typeof h.layouts!=='object')return false;
 for(const [house,floors] of Object.entries(h.layouts)){const def=HOUSES[house as HouseId];if(!def||house==='tro'||!floors||typeof floors!=='object')return false;const seen=new Set<string>();for(const [fk,items] of Object.entries(floors)){const f=def.floors.find(x=>String(x.id)===fk);if(!f||!Array.isArray(items)||!items.every(p=>p&&Object.hasOwn(HOME_ITEMS,p.id)&&!seen.has(p.id)&&(seen.add(p.id),true)&&ROTATIONS.includes(p.rotation)))return false;if(placeError(f,items))return false}}
 return h.relax===undefined||Object.values(h.relax).every(d=>Number.isInteger(d)&&(d as number)>=0&&(d as number)<=day)}
