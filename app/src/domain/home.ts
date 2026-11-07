import type {GameState,GameResult} from './types';
import {post} from './money';
import {clockOf} from './time';
export const HOME_ITEMS={bed:{name:'Giường đơn',price:1400000,w:1,h:2,icon:'home'},wardrobe:{name:'Tủ quần áo',price:950000,w:2,h:1,icon:'bag'},desk:{name:'Bàn laptop',price:850000,w:2,h:2,icon:'briefcase'},table:{name:'Bàn ăn nhỏ',price:420000,w:2,h:2,icon:'cup'},plant:{name:'Chậu cây',price:180000,w:1,h:1,icon:'health'},lamp:{name:'Đèn ngủ',price:350000,w:1,h:1,icon:'bell'},rug:{name:'Thảm nhỏ',price:650000,w:3,h:2,icon:'grid'},painting:{name:'Tranh treo tường',price:280000,w:2,h:1,icon:'map'},fridge:{name:'Tủ lạnh',price:2500000,w:1,h:1,icon:'snow'},tv:{name:'TV',price:3200000,w:2,h:1,icon:'play'}} as const;
export type HomeId=keyof typeof HOME_ITEMS;
export const HOME_TIERS={basic:{name:'Cơ bản',factor:1,comfort:0},comfort:{name:'Tiện nghi',factor:1.6,comfort:1},premium:{name:'Cao cấp',factor:2.5,comfort:2}} as const;
export type HomeTier=keyof typeof HOME_TIERS;
/** Mỗi mẫu một món riêng (chốt 04/11): không ghi hạng, mẫu đắt hơn đẹp hơn, êm hơn. Khoá là hạng nội bộ. */
export const HOME_MODELS:Record<HomeId,Record<HomeTier,string>>={bed:{basic:'Giường đơn khung sắt',comfort:'Giường gỗ có ngăn kéo',premium:'Giường bọc nệm có đèn đầu giường'},wardrobe:{basic:'Tủ vải khung thép',comfort:'Tủ gỗ hai cánh',premium:'Tủ gỗ có gương và đèn'},desk:{basic:'Bàn gấp gọn',comfort:'Bàn gỗ có kệ sách',premium:'Bàn nâng hạ có màn phụ'},table:{basic:'Bàn nhựa xếp',comfort:'Bàn gỗ tròn',premium:'Bàn mặt đá chân gỗ'},plant:{basic:'Chậu xương rồng',comfort:'Chậu trầu bà',premium:'Bàng Singapore chậu gốm'},lamp:{basic:'Đèn kẹp',comfort:'Đèn gốm',premium:'Đèn đồng chao vải'},rug:{basic:'Thảm cói',comfort:'Thảm len',premium:'Thảm dệt hoa văn'},painting:{basic:'Tranh in',comfort:'Tranh sơn dầu nhỏ',premium:'Tranh khung gỗ lớn'},fridge:{basic:'Tủ lạnh mini',comfort:'Tủ lạnh hai cửa',premium:'Tủ lạnh ngăn đông mềm'},tv:{basic:'TV 32 inch chân đế',comfort:'TV 43 inch kèm kệ',premium:'TV 55 inch kèm kệ gỗ'}};
export const homeName=(id:HomeId,tier:HomeTier='basic')=>HOME_MODELS[id]?.[tier]??HOME_ITEMS[id].name;
/** Giá riêng khi không theo hệ số hạng (T21: tủ lạnh 2,5 / 4,5 / 8 triệu). */
const PRICE:Partial<Record<HomeId,Record<HomeTier,number>>>={fridge:{basic:2500000,comfort:4500000,premium:8000000},tv:{basic:3200000,comfort:5500000,premium:9500000}};
export const homePrice=(id:HomeId,tier:HomeTier='basic')=>PRICE[id]?.[tier]??Math.round(HOME_ITEMS[id].price*HOME_TIERS[tier].factor);
/** T21: tủ lạnh (chủ dự án duyệt 04/11): sức chứa theo phần, hạn dùng kéo dài theo hệ số; gạo không đổi. */
/** T55: `cap` là số loại đồ (ô), không phải số lượng: 26 kg gạo cùng loại chỉ chiếm 1 ô. */
export const FRIDGE:Record<HomeTier,{cap:number;factor:number}>={basic:{cap:10,factor:2},comfort:{cap:15,factor:2.5},premium:{cap:25,factor:3}};
export function fridgeOf(s:GameState){const f=homeOf(s).items.find(i=>i.id==='fridge');return f?FRIDGE[f.tier??'basic']:null}
export interface HomeObject{uid?:string;tier?:HomeTier;mount?:'floor'|'surface'|'wall';parentId?:string;wall?:'left'|'right';id:HomeId;x:number;y:number;rotation:0|90|180|270;placed:boolean}
export interface HomeState{items:HomeObject[];grid?:8}
export const HOME_GRID=8;
/** Số lượng tối đa mỗi món (T26). */
export const HOME_MAX:Record<HomeId,number>={bed:1,wardrobe:1,desk:1,table:1,plant:3,lamp:3,rug:1,painting:2,fridge:1,tv:1};
/** Mã bản thể (instanceId): bản đầu của mỗi loại giữ mã loại để save cũ khớp. */
export const uidOf=(i:{id:HomeId;uid?:string})=>i.uid??i.id;
function withUids(items:HomeObject[]):HomeObject[]{const seen=new Map<HomeId,number>();return items.map(i=>{const n=(seen.get(i.id)??0)+1;seen.set(i.id,n);return i.uid?i:{...i,uid:n===1?i.id:`${i.id}-${n}`}})}
/** T28: điểm dùng của đồ. Chỉ đồ đang đặt trong phòng trọ (đang ở trọ) mới có hiệu ứng. */
export const BED_ENERGY:Record<HomeTier,number>={basic:0,comfort:4,premium:8};
export const TABLE_MOOD:Record<HomeTier,number>={basic:2,comfort:3,premium:4};
export const DECOR:HomeId[]=['plant','lamp','rug','painting'],DECOR_CAP=6;
export const livesInTro=(s:GameState)=>(s.housing?.house??'tro')==='tro';
export function placedAt(s:GameState,id:HomeId):HomeObject|null{if(!livesInTro(s))return null;return homeOf(s).items.find(i=>i.id===id&&i.placed)??null}
/** Giảm căng thẳng mỗi đêm: đồ trang trí 1 + bậc mẫu, đồ khác theo bậc mẫu; cộng dồn tối đa 6. */
export function decorRelief(s:GameState){if(!livesInTro(s))return 0;const t=homeOf(s).items.filter(i=>i.placed).reduce((n,i)=>n+(DECOR.includes(i.id)?1:0)+HOME_TIERS[i.tier??'basic'].comfort,0);return Math.min(DECOR_CAP,t)}
export const HOME_BATH={x:5,y:0,w:3,h:3};
export const HOME_KITCHEN={x:0,y:0,w:5,h:1};
/** Việc 7: đồ treo tường (sau này đồng hồ, kệ treo, gương). Bề rộng dọc tường lấy theo HOME_ITEMS.w. */
export const WALL_ITEMS:HomeId[]=['painting'];
export const isWallItem=(id:HomeId)=>WALL_ITEMS.includes(id);
/** Ô tường theo lưới 8 ô của ảnh phòng: trái (x=0, dọc theo y), sau (y=0, dọc theo x). Ô cấm: cửa sổ 2–5; tủ bếp 0–4, vòi sen 7. */
export const HOME_WALLS:Record<'left'|'right',{blocked:number[]}>={left:{blocked:[2,3,4,5]},right:{blocked:[0,1,2,3,4,7]}};
export type WallSlot={wall:'left'|'right';at:number};
export const wallAt=(o:HomeObject)=>o.wall==='right'?o.x:o.y;
export const onWall=(o:HomeObject,slot:WallSlot):HomeObject=>({...o,mount:'wall',wall:slot.wall,parentId:undefined,x:slot.wall==='right'?slot.at:0,y:slot.wall==='left'?slot.at:0,rotation:0,placed:true});
export function wallSlots(id:HomeId):WallSlot[]{const w=HOME_ITEMS[id].w,out:WallSlot[]=[];for(const wall of ['left','right'] as const)for(let at=0;at+w<=HOME_GRID;at++)if(!HOME_WALLS[wall].blocked.some(c=>c>=at&&c<at+w))out.push({wall,at});return out}
export function wallError(a:HomeObject,items:HomeObject[]):string|null{
 if(!isWallItem(a.id)||(a.wall!=='left'&&a.wall!=='right'))return 'Đồ không treo được lên tường.';
 const at=wallAt(a),w=HOME_ITEMS[a.id].w;
 if((a.wall==='left'?a.x:a.y)!==0||!wallSlots(a.id).some(s=>s.wall===a.wall&&s.at===at))return 'Chừa cửa sổ và tủ bếp.';
 if(items.some(b=>b!==a&&uidOf(b)!==uidOf(a)&&b.placed&&b.mount==='wall'&&b.wall===a.wall&&at<wallAt(b)+HOME_ITEMS[b.id].w&&wallAt(b)<at+w))return 'Đồ treo đang chồng lên nhau.';
 return null}
/** Save cũ: đồ treo ở ô nay không hợp lệ (hoặc nằm trên sàn) thì cất vào kho thay vì làm hỏng cả bố cục. */
export function fixWalls(items:HomeObject[]):HomeObject[]{const out:HomeObject[]=[];for(const i of items)out.push(isWallItem(i.id)&&i.placed&&(i.mount!=='wall'||wallError(i,out))?{...i,mount:'wall',wall:'left',parentId:undefined,x:0,y:0,rotation:0,placed:false}:i);return out}
export const LEGACY_SIZE:Partial<Record<HomeId,{w:number;h:number}>>={bed:{w:2,h:4}};
export function homeOf(s:GameState):HomeState{const items=s.home?(s.home.grid===HOME_GRID?s.home.items:migrateHome(s.home.items)):[{id:'bed' as const,x:0,y:3,rotation:0 as const,placed:true},{id:'desk' as const,x:0,y:6,rotation:0 as const,placed:true}];const legacy=s.owned.filter(id=>!items.some(i=>i.id===id)).map(id=>({id,x:0,y:0,rotation:0 as const,placed:false}));const oldTv=s.life?.owned.includes('tv')&&!items.some(i=>i.id==='tv')?[{id:'tv' as const,tier:'basic' as const,x:0,y:0,rotation:0 as const,placed:false}]:[],extra=[...legacy,...oldTv];return {items:fixWalls(withUids(extra.length?[...items,...extra]:items)),grid:HOME_GRID}}
export function homeBlocked(x:number,y:number){return x>=HOME_BATH.x&&y<HOME_BATH.y+HOME_BATH.h||x<HOME_KITCHEN.x+HOME_KITCHEN.w&&y<HOME_KITCHEN.y+HOME_KITCHEN.h}
function rectBlocked(x:number,y:number,w:number,h:number){for(let cx=Math.floor(x);cx<Math.ceil(x+w);cx++)for(let cy=Math.floor(y);cy<Math.ceil(y+h);cy++)if(homeBlocked(cx,cy))return true;return false}
/** Xoay 90° quanh gốc ô, đủ 4 hướng; tọa độ cũ nửa ô bám về ô nguyên (#366). */
export function rotateHomeObject(item:HomeObject):HomeObject{if(item.mount==='wall'||item.mount==='surface')return item;const next=((item.rotation+90)%360) as HomeObject['rotation'];return {...item,rotation:next,x:Math.round(item.x),y:Math.round(item.y)}}
export function homeError(items:HomeObject[]):string|null{const occupied:{x:number;y:number;w:number;h:number}[]=[];for(const a of items){if(!a.placed)continue;
 if(a.mount==='surface'){const p=items.find(i=>uidOf(i)===a.parentId&&i.placed&&(!i.mount||i.mount==='floor'));if(!['lamp','plant'].includes(a.id)||!p||!['desk','table'].includes(p.id))return 'Cần bàn đang đặt trong phòng.';if(items.some(b=>b!==a&&b.placed&&b.mount==='surface'&&b.parentId===a.parentId&&b.id===a.id))return 'Mặt bàn đã có món này.';continue}
 if(a.mount==='wall'){const e=wallError(a,items);if(e)return e;continue}
 if(isWallItem(a.id))return 'Hãy kéo tranh lên tường.';
 const t=HOME_ITEMS[a.id],w=a.rotation%180?t.h:t.w,h=a.rotation%180?t.w:t.h;if(a.x<0||a.y<0||a.x+w>HOME_GRID||a.y+h>HOME_GRID)return 'Đồ nằm ngoài vùng đặt an toàn.';if(rectBlocked(a.x,a.y,w,h))return 'Cần chừa bếp và vệ sinh.';if(occupied.some(b=>a.x<b.x+b.w&&a.x+w>b.x&&a.y<b.y+b.h&&a.y+h>b.y))return 'Đồ đang chồng lên nhau.';occupied.push({x:a.x,y:a.y,w,h})}return null}
export function validHome(v:unknown):v is HomeState{const a=v as HomeState;return !!a&&Array.isArray(a.items)&&a.items.length<=Object.values(HOME_MAX).reduce((n,m)=>n+m,0)&&new Set(a.items.map(uidOf)).size===a.items.length&&(Object.keys(HOME_ITEMS) as HomeId[]).every(id=>a.items.filter(i=>i.id===id).length<=HOME_MAX[id])&&a.items.every(i=>!!i&&Object.hasOwn(HOME_ITEMS,i.id)&&Number.isInteger(i.x*2)&&Number.isInteger(i.y*2)&&i.x>=0&&i.x<=10&&i.y>=0&&i.y<=10&&[0,90,180,270].includes(i.rotation)&&typeof i.placed==='boolean'&&(i.tier===undefined||Object.hasOwn(HOME_TIERS,i.tier))&&(i.mount===undefined||['floor','surface','wall'].includes(i.mount))&&(i.parentId===undefined||typeof i.parentId==='string'&&a.items.some(p=>uidOf(p)===i.parentId))&&(i.uid===undefined||typeof i.uid==='string'&&(i.uid===i.id||new RegExp('^'+i.id+'-[2-9]$').test(i.uid)))&&(i.wall===undefined||['left','right'].includes(i.wall)))&&(a.grid===HOME_GRID?!homeError(fixWalls(a.items)):a.grid===undefined)}
/** Tính kết quả mua nhưng chưa trừ tiền; đơn hàng (T29) dùng lại để gộp nhiều món vào một lần trả. */
export function planHome(s:GameState,id:HomeId,tier:HomeTier='basic'):{ok:true;state:GameState;price:number;uid:string;upgrade:boolean}|{ok:false;error:string}{if(!Object.hasOwn(HOME_ITEMS,id)||!Object.hasOwn(HOME_TIERS,tier))return{ok:false,error:'Đồ không hợp lệ.'};const h=homeOf(s),same=h.items.filter(i=>i.id===id),stack=HOME_MAX[id]>1,old=stack?undefined:same[0];if(stack&&same.length>=HOME_MAX[id])return{ok:false,error:'Đã đủ số lượng.'};if(old&&HOME_TIERS[old.tier??'basic'].comfort>=HOME_TIERS[tier].comfort)return{ok:false,error:'Đã sở hữu cấp này.'};const price=homePrice(id,tier)-(old?homePrice(id,old.tier??'basic'):0);const uid=stack?(same.some(i=>uidOf(i)===id)?Array.from({length:HOME_MAX[id]},(_,k)=>`${id}-${k+2}`).find(u=>!same.some(i=>uidOf(i)===u))!:id):id;const item:HomeObject=old?{...old,tier}:{id,uid,x:0,y:0,rotation:0,placed:false,tier,...(isWallItem(id)?{mount:'wall' as const,wall:'left' as const}:{})};const n:GameState={...s,home:{grid:HOME_GRID,items:old?h.items.map(i=>i.id===id?item:i):[...h.items,item]}};return{ok:true,state:n,price,uid,upgrade:!!old}}
export function buyHome(s:GameState,id:HomeId,tier:HomeTier='basic'):GameResult{const p=planHome(s,id,tier);if(!p.ok)return p;if(s.money<p.price)return{ok:false,error:'Chưa đủ tiền.'};const n=p.state;if(post(n,{id:`home:${p.uid}:${tier}`,name:(p.upgrade?'Nâng cấp ':'Mua ')+HOME_ITEMS[id].name+' '+HOME_TIERS[tier].name,amount:-p.price})!=='ok')return{ok:false,error:'Chưa đủ tiền.'};return{ok:true,state:n}}
export function saveHome(s:GameState,items:HomeObject[]):GameResult{if(clockOf(s).location!=='home'||(s.housing&&s.housing.house!=='tro')||s.work?.active)return{ok:false,error:'Hãy về nhà để sắp xếp.'};if(!items.some(i=>i.id==='bed'&&i.placed))return{ok:false,error:'Cần giữ giường trong phòng.'};const strict=homeError(items);if(strict||!validHome({items,grid:HOME_GRID}))return{ok:false,error:strict??'Bố cục không hợp lệ.'};const walk=homeWalkError(items);if(walk)return{ok:false,error:walk};const owned=homeOf(s).items;if(items.length!==owned.length||items.some(i=>!owned.some(o=>uidOf(o)===uidOf(i)&&o.id===i.id)))return{ok:false,error:'Chỉ đặt đồ đã sở hữu.'};return{ok:true,state:{...s,home:{grid:HOME_GRID,items:withUids(structuredClone(items))}}}}

/** Lối đi (T27): mọi ô sàn trống thông với bếp; từ bếp tới được lối vào vệ sinh và cạnh giường. Chỉ kiểm khi lưu, không dùng khi tải save. */
export function homeWalkError(items:HomeObject[]):string|null{
 const n=HOME_GRID,key=(x:number,y:number)=>x*n+y,solid=new Set<number>();
 for(let x=0;x<n;x++)for(let y=0;y<n;y++)if(homeBlocked(x,y))solid.add(key(x,y));
 const cellsOf=(i:HomeObject)=>{const t=HOME_ITEMS[i.id],w=i.rotation%180?t.h:t.w,h=i.rotation%180?t.w:t.h,out:[number,number][]=[];for(let x=Math.floor(i.x);x<Math.ceil(i.x+w);x++)for(let y=Math.floor(i.y);y<Math.ceil(i.y+h);y++)if(x>=0&&y>=0&&x<n&&y<n)out.push([x,y]);return out};
 const floor=items.filter(i=>i.placed&&(!i.mount||i.mount==='floor')&&i.id!=='rug');
 for(const i of floor)for(const [x,y] of cellsOf(i))solid.add(key(x,y));
 const open=(x:number,y:number)=>x>=0&&y>=0&&x<n&&y<n&&!solid.has(key(x,y));
 const seen=new Set<number>(),queue:[number,number][]=[];
 for(const x of [1,2,3])if(open(x,1)){seen.add(key(x,1));queue.push([x,1])}
 for(let q=0;q<queue.length;q++){const [x,y]=queue[q];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(open(nx,ny)&&!seen.has(key(nx,ny))){seen.add(key(nx,ny));queue.push([nx,ny])}}}
 const reach=(cells:[number,number][])=>cells.some(([x,y])=>seen.has(key(x,y)));
 const bed=floor.find(i=>i.id==='bed'),bedSide:[number,number][]=bed?cellsOf(bed).flatMap(([x,y])=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]):[];
 if(!queue.length||!reach([[4,1],[4,2],[5,3],[6,3],[7,3]])||!reach(bedSide))return 'Chừa lối đi tới bếp, vệ sinh và giường.';
 return null}
// Lưới cũ 10×10 sang 8×8: co tọa độ theo 0,8, đưa đồ lệch vào chỗ trống gần nhất, hết chỗ thì cất vào kho.
export function migrateHome(old:HomeObject[]):HomeObject[]{
 const snap=(v:number)=>Math.round(v*0.8*2)/2;const out:HomeObject[]=[];
 const fits=(list:HomeObject[],c:HomeObject)=>!homeError([...list,c]);
 const order=[...old].sort((a,b)=>Number(b.placed)-Number(a.placed));
 for(const it of order){
  if(!it.placed||it.mount==='surface'){out.push(it);continue}
  if(it.mount==='wall'||isWallItem(it.id)){const c=wallSlots(it.id).map(sl=>onWall(it,sl)).find(c=>fits(out,c));out.push(c??{...it,mount:'wall',wall:'left',x:0,y:0,placed:false});continue}
  const t=HOME_ITEMS[it.id],w=it.rotation%180?t.h:t.w,h=it.rotation%180?t.w:t.h;
  const want={...it,x:Math.max(0,Math.min(HOME_GRID-w,snap(it.x))),y:Math.max(0,Math.min(HOME_GRID-h,snap(it.y)))};
  if(fits(out,want)){out.push(want);continue}
  let best:HomeObject|null=null,bestD=Infinity;
  for(let x=0;x+w<=HOME_GRID;x++)for(let y=0;y+h<=HOME_GRID;y++){const c={...it,x,y};if(!fits(out,c))continue;const d=(x-want.x)**2+(y-want.y)**2;if(d<bestD){bestD=d;best=c}}
  out.push(best??{...it,placed:false,x:0,y:0});
 }
 // đồ trên mặt bàn mà bàn đã bị cất: bỏ đặt
 return out.map(i=>i.mount==='surface'&&i.placed&&!out.some(p=>uidOf(p)===i.parentId&&p.placed)?{...i,placed:false}:i).sort((a,b)=>old.findIndex(i=>uidOf(i)===uidOf(a))-old.findIndex(i=>uidOf(i)===uidOf(b)));
}
