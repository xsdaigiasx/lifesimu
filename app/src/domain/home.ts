import type {GameState,GameResult} from './types';
import {post} from './money';
import {clockOf} from './time';
export const HOME_ITEMS={bed:{name:'Giường đơn',price:1400000,w:2,h:3,icon:'home'},wardrobe:{name:'Tủ quần áo',price:950000,w:2,h:1,icon:'bag'},desk:{name:'Bàn laptop',price:850000,w:2,h:2,icon:'briefcase'},table:{name:'Bàn ăn nhỏ',price:420000,w:2,h:2,icon:'cup'},plant:{name:'Chậu cây',price:180000,w:1,h:1,icon:'health'},lamp:{name:'Đèn ngủ',price:350000,w:1,h:1,icon:'bell'},rug:{name:'Thảm nhỏ',price:650000,w:3,h:2,icon:'grid'},painting:{name:'Tranh treo tường',price:280000,w:2,h:1,icon:'map'},fridge:{name:'Tủ lạnh',price:2500000,w:1,h:1,icon:'snow'}} as const;
export type HomeId=keyof typeof HOME_ITEMS;
export const HOME_TIERS={basic:{name:'Cơ bản',factor:1,comfort:0},comfort:{name:'Tiện nghi',factor:1.6,comfort:1},premium:{name:'Cao cấp',factor:2.5,comfort:2}} as const;
export type HomeTier=keyof typeof HOME_TIERS;
/** Mỗi mẫu một món riêng (chốt 04/11): không ghi hạng, mẫu đắt hơn đẹp hơn, êm hơn. Khoá là hạng nội bộ. */
export const HOME_MODELS:Record<HomeId,Record<HomeTier,string>>={bed:{basic:'Giường đơn khung sắt',comfort:'Giường gỗ có ngăn kéo',premium:'Giường bọc nệm có đèn đầu giường'},wardrobe:{basic:'Tủ vải khung thép',comfort:'Tủ gỗ hai cánh',premium:'Tủ gỗ có gương và đèn'},desk:{basic:'Bàn gấp gọn',comfort:'Bàn gỗ có kệ sách',premium:'Bàn nâng hạ có màn phụ'},table:{basic:'Bàn nhựa xếp',comfort:'Bàn gỗ tròn',premium:'Bàn mặt đá chân gỗ'},plant:{basic:'Chậu xương rồng',comfort:'Chậu trầu bà',premium:'Bàng Singapore chậu gốm'},lamp:{basic:'Đèn kẹp',comfort:'Đèn gốm',premium:'Đèn đồng chao vải'},rug:{basic:'Thảm cói',comfort:'Thảm len',premium:'Thảm dệt hoa văn'},painting:{basic:'Tranh in',comfort:'Tranh sơn dầu nhỏ',premium:'Tranh khung gỗ lớn'},fridge:{basic:'Tủ lạnh mini',comfort:'Tủ lạnh hai cửa',premium:'Tủ lạnh ngăn đông mềm'}};
export const homeName=(id:HomeId,tier:HomeTier='basic')=>HOME_MODELS[id]?.[tier]??HOME_ITEMS[id].name;
/** Giá riêng khi không theo hệ số hạng (T21: tủ lạnh 2,5 / 4,5 / 8 triệu). */
const PRICE:Partial<Record<HomeId,Record<HomeTier,number>>>={fridge:{basic:2500000,comfort:4500000,premium:8000000}};
export const homePrice=(id:HomeId,tier:HomeTier='basic')=>PRICE[id]?.[tier]??Math.round(HOME_ITEMS[id].price*HOME_TIERS[tier].factor);
/** T21: tủ lạnh (chủ dự án duyệt 04/11): sức chứa theo phần, hạn dùng kéo dài theo hệ số; gạo không đổi. */
export const FRIDGE:Record<HomeTier,{cap:number;factor:number}>={basic:{cap:20,factor:2},comfort:{cap:35,factor:2.5},premium:{cap:60,factor:3}};
export function fridgeOf(s:GameState){const f=homeOf(s).items.find(i=>i.id==='fridge');return f?FRIDGE[f.tier??'basic']:null}
export interface HomeObject{tier?:HomeTier;mount?:'floor'|'surface'|'wall';parentId?:HomeId;wall?:'left'|'right';id:HomeId;x:number;y:number;rotation:0|90|180|270;placed:boolean}
export interface HomeState{items:HomeObject[];grid?:8}
export const HOME_GRID=8;
export const HOME_BATH={x:5,y:0,w:3,h:3};
export const HOME_KITCHEN={x:0,y:0,w:5,h:1};
export const LEGACY_SIZE:Partial<Record<HomeId,{w:number;h:number}>>={bed:{w:2,h:4}};
export function homeOf(s:GameState):HomeState{const items=s.home?(s.home.grid===HOME_GRID?s.home.items:migrateHome(s.home.items)):[{id:'bed' as const,x:0,y:3,rotation:0 as const,placed:true},{id:'desk' as const,x:0,y:6,rotation:0 as const,placed:true}];const legacy=s.owned.filter(id=>!items.some(i=>i.id===id)).map(id=>({id,x:0,y:0,rotation:0 as const,placed:false}));return {items:legacy.length?[...items,...legacy]:items,grid:HOME_GRID}}
export function homeBlocked(x:number,y:number){return x>=HOME_BATH.x&&y<HOME_BATH.y+HOME_BATH.h||x<HOME_KITCHEN.x+HOME_KITCHEN.w&&y<HOME_KITCHEN.y+HOME_KITCHEN.h}
function rectBlocked(x:number,y:number,w:number,h:number){for(let cx=Math.floor(x);cx<Math.ceil(x+w);cx++)for(let cy=Math.floor(y);cy<Math.ceil(y+h);cy++)if(homeBlocked(cx,cy))return true;return false}
/** Xoay 90° theo chiều kim đồng hồ quanh tâm, đủ 4 hướng (chốt 04/11). */
export function rotateHomeObject(item:HomeObject):HomeObject{if(item.mount==='wall'||item.mount==='surface')return item;const t=HOME_ITEMS[item.id],w=item.rotation%180?t.h:t.w,h=item.rotation%180?t.w:t.h,next=((item.rotation+90)%360) as HomeObject['rotation'];return {...item,rotation:next,x:item.x+(w-h)/2,y:item.y+(h-w)/2}}
export function homeError(items:HomeObject[]):string|null{const occupied:{x:number;y:number;w:number;h:number}[]=[];for(const a of items){if(!a.placed)continue;
 if(a.mount==='surface'){const p=items.find(i=>i.id===a.parentId&&i.placed&&(!i.mount||i.mount==='floor'));if(!['lamp','plant'].includes(a.id)||!p||!['desk','table'].includes(p.id))return 'Cần bàn đang đặt trong phòng.';if(items.some(b=>b!==a&&b.placed&&b.mount==='surface'&&b.parentId===a.parentId&&b.id===a.id))return 'Mặt bàn đã có món này.';continue}
 if(a.mount==='wall'){if(a.id!=='painting'||!['left','right'].includes(a.wall??''))return 'Đồ không treo được lên tường.';if(a.wall==='left'&&(a.y<6||a.y+2>HOME_GRID)||a.wall==='right'&&(a.x<0||a.x+2>3))return 'Chừa cửa sổ và khu vệ sinh.';continue}
 if(a.id==='painting')return 'Hãy chọn tường để treo tranh.';
 const t=HOME_ITEMS[a.id],w=a.rotation%180?t.h:t.w,h=a.rotation%180?t.w:t.h;if(a.x<0||a.y<0||a.x+w>HOME_GRID||a.y+h>HOME_GRID)return 'Đồ nằm ngoài vùng đặt an toàn.';if(rectBlocked(a.x,a.y,w,h))return 'Cần chừa bếp và vệ sinh.';if(occupied.some(b=>a.x<b.x+b.w&&a.x+w>b.x&&a.y<b.y+b.h&&a.y+h>b.y))return 'Đồ đang chồng lên nhau.';occupied.push({x:a.x,y:a.y,w,h})}return null}
export function validHome(v:unknown):v is HomeState{const a=v as HomeState;return !!a&&Array.isArray(a.items)&&a.items.length<=Object.keys(HOME_ITEMS).length&&new Set(a.items.map(i=>i.id)).size===a.items.length&&a.items.every(i=>!!i&&Object.hasOwn(HOME_ITEMS,i.id)&&Number.isInteger(i.x*2)&&Number.isInteger(i.y*2)&&i.x>=0&&i.x<=10&&i.y>=0&&i.y<=10&&[0,90,180,270].includes(i.rotation)&&typeof i.placed==='boolean'&&(i.tier===undefined||Object.hasOwn(HOME_TIERS,i.tier))&&(i.mount===undefined||['floor','surface','wall'].includes(i.mount))&&(i.parentId===undefined||Object.hasOwn(HOME_ITEMS,i.parentId))&&(i.wall===undefined||['left','right'].includes(i.wall)))&&(a.grid===HOME_GRID?!homeError(a.items):a.grid===undefined)}
export function buyHome(s:GameState,id:HomeId,tier:HomeTier='basic'):GameResult{if(!Object.hasOwn(HOME_ITEMS,id)||!Object.hasOwn(HOME_TIERS,tier))return{ok:false,error:'Đồ không hợp lệ.'};const h=homeOf(s),old=h.items.find(i=>i.id===id);if(old&&HOME_TIERS[old.tier??'basic'].comfort>=HOME_TIERS[tier].comfort)return{ok:false,error:'Đã sở hữu cấp này.'};const price=homePrice(id,tier)-(old?homePrice(id,old.tier??'basic'):0);if(s.money<price)return{ok:false,error:'Chưa đủ tiền.'};const item:HomeObject=old?{...old,tier}:{id,x:0,y:id==='painting'?6:0,rotation:0,placed:false,tier,...(id==='painting'?{mount:'wall' as const,wall:'left' as const}:{})};const n:GameState={...s,home:{grid:HOME_GRID,items:old?h.items.map(i=>i.id===id?item:i):[...h.items,item]}};if(post(n,{id:`home:${id}:${tier}`,name:(old?'Nâng cấp ':'Mua ')+HOME_ITEMS[id].name+' '+HOME_TIERS[tier].name,amount:-price})!=='ok')return{ok:false,error:'Chưa đủ tiền.'};return{ok:true,state:n}}
export function saveHome(s:GameState,items:HomeObject[]):GameResult{if(clockOf(s).location!=='home'||(s.housing&&s.housing.house!=='tro')||s.work?.active)return{ok:false,error:'Hãy về nhà để sắp xếp.'};if(!items.some(i=>i.id==='bed'&&i.placed))return{ok:false,error:'Cần giữ giường trong phòng.'};if(!validHome({items,grid:HOME_GRID}))return{ok:false,error:homeError(items)??'Bố cục không hợp lệ.'};const owned=homeOf(s).items;if(items.length!==owned.length||items.some(i=>!owned.some(o=>o.id===i.id)))return{ok:false,error:'Chỉ đặt đồ đã sở hữu.'};return{ok:true,state:{...s,home:{grid:HOME_GRID,items:structuredClone(items)}}}}

// Lưới cũ 10×10 sang 8×8: co tọa độ theo 0,8, đưa đồ lệch vào chỗ trống gần nhất, hết chỗ thì cất vào kho.
export function migrateHome(old:HomeObject[]):HomeObject[]{
 const snap=(v:number)=>Math.round(v*0.8*2)/2;const out:HomeObject[]=[];
 const fits=(list:HomeObject[],c:HomeObject)=>!homeError([...list,c]);
 const order=[...old].sort((a,b)=>Number(b.placed)-Number(a.placed));
 for(const it of order){
  if(!it.placed||it.mount==='surface'){out.push(it);continue}
  if(it.mount==='wall'){const wall=it.wall??'left',c:HomeObject={...it,wall,x:wall==='right'?0:0,y:wall==='left'?6:0};out.push(fits(out,c)?c:{...it,placed:false,x:0,y:0});continue}
  const t=HOME_ITEMS[it.id],w=it.rotation%180?t.h:t.w,h=it.rotation%180?t.w:t.h;
  const want={...it,x:Math.max(0,Math.min(HOME_GRID-w,snap(it.x))),y:Math.max(0,Math.min(HOME_GRID-h,snap(it.y)))};
  if(fits(out,want)){out.push(want);continue}
  let best:HomeObject|null=null,bestD=Infinity;
  for(let x=0;x+w<=HOME_GRID;x++)for(let y=0;y+h<=HOME_GRID;y++){const c={...it,x,y};if(!fits(out,c))continue;const d=(x-want.x)**2+(y-want.y)**2;if(d<bestD){bestD=d;best=c}}
  out.push(best??{...it,placed:false,x:0,y:0});
 }
 // đồ trên mặt bàn mà bàn đã bị cất: bỏ đặt
 return out.map(i=>i.mount==='surface'&&i.placed&&!out.some(p=>p.id===i.parentId&&p.placed)?{...i,placed:false}:i).sort((a,b)=>old.findIndex(i=>i.id===a.id)-old.findIndex(i=>i.id===b.id));
}
