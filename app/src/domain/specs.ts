import {PRODUCTS,INGREDIENTS,NO_CHILL,type ProductId,type IngredientId} from './life';
import {HOME_ITEMS,HOME_TIERS,homeName,type HomeId,type HomeTier} from './home';
import {MODES} from './travel';
import {money} from './format';
import type {Line} from './orders';

/** Thông số vật lý và điện của đồ trong TTTM. Số liệu trò chơi, dùng cho nút "i" và phí giao đơn điện thoại. */
export const DELIVERY={base:10000,perKg:800,min:15000,max:120000,kgPerM3:100} as const;

type Cm=[number,number,number];
const PRODUCT_SPEC:Record<ProductId,{kg:number;cm:Cm;watt?:number}>={
 headphones:{kg:.25,cm:[18,16,8],watt:2},laptopMid:{kg:1.8,cm:[34,24,2],watt:50},laptopPro:{kg:2.2,cm:[36,25,2],watt:100},tv:{kg:8,cm:[90,10,55],watt:60},
 casual:{kg:.4,cm:[30,25,4]},officeWear:{kg:.9,cm:[35,28,6]},coat:{kg:1.4,cm:[40,30,10]},
 bicycle:{kg:14,cm:[170,60,105]},motorbike:{kg:105,cm:[190,70,105]},scooter:{kg:115,cm:[185,70,110]},
 backpack:{kg:.8,cm:[30,15,45]}};
const HOME_KG:Record<HomeId,number>={bed:28,wardrobe:35,desk:18,table:9,plant:4,lamp:1.2,rug:3,painting:2.5,fridge:38};
const HOME_HEIGHT:Record<HomeId,number>={bed:50,wardrobe:180,desk:75,table:75,plant:60,lamp:35,rug:1,painting:4,fridge:85};
const HOME_TIER_KG:Record<HomeTier,number>={basic:1,comfort:1.25,premium:1.6};
const HOME_WATT:Partial<Record<HomeId,Record<HomeTier,number>>>={lamp:{basic:5,comfort:7,premium:9},fridge:{basic:70,comfort:90,premium:110}};

export interface Body{kg:number;cm:Cm;watt?:number}
/** Cân nặng, kích thước (cm: rộng, sâu, cao) và công suất (W) của một dòng hàng. */
export function bodyOf(l:Line):Body{
 if(l.kind==='product')return PRODUCT_SPEC[l.id];
 const it=HOME_ITEMS[l.id];
 return{kg:Math.round(HOME_KG[l.id]*HOME_TIER_KG[l.tier]*10)/10,cm:[it.w*50,it.h*50,HOME_HEIGHT[l.id]],watt:HOME_WATT[l.id]?.[l.tier]};
}
/** Cân tính phí: lấy số lớn hơn giữa cân thật và cân quy đổi theo thể tích. */
export function billableKg(b:Body):number{const m3=b.cm[0]*b.cm[1]*b.cm[2]/1e6;return Math.max(b.kg,m3*DELIVERY.kgPerM3)}
/** Phí giao cho một đơn đặt qua điện thoại: cộng cân tính phí các món, làm tròn nghìn, trong khoảng [min, max]. */
export function deliveryFee(lines:Line[]):number{
 if(!lines.length)return 0;
 const kg=lines.reduce((t,l)=>t+billableKg(bodyOf(l)),0);
 const raw=Math.round((DELIVERY.base+DELIVERY.perKg*kg)/1000)*1000;
 return Math.min(DELIVERY.max,Math.max(DELIVERY.min,raw));
}

export interface SpecRow{icon:string;label:string;value:string}
export interface Spec{title:string;kind:'food'|'furniture'|'electronics'|'transport'|'clothing'|'bag';rows:SpecRow[]}
const num=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:1});
const kgText=(kg:number)=>kg<1?`${Math.round(kg*1000)} g`:`${num(kg)} kg`;
const sizeText=(cm:Cm)=>cm[0]>=100||cm[1]>=100||cm[2]>=100?cm.map(v=>num(v/100)).join(' × ')+' m':cm.join(' × ')+' cm';

/** Thông tin chi tiết của thực phẩm: hạn dùng, bảo quản, độ dễ hỏng. */
export function foodSpec(id:IngredientId):Spec{
 const f=INGREDIENTS[id];
 return{title:f.name,kind:'food',rows:[
  {icon:'clock',label:'Hạn dùng',value:`${f.days} ngày`},
  {icon:'snow',label:'Bảo quản',value:NO_CHILL.includes(id)?'Để nơi khô ráo':'Nên để tủ lạnh'},
  {icon:'health',label:'Độ tươi',value:f.days<=1?'Hỏng rất nhanh':f.days<=2?'Dễ hỏng':f.days<=5?'Vừa phải':'Để lâu được'},
  {icon:'coin',label:'Giá',value:money(f.price)}]};
}

/** Thông tin chi tiết của một dòng hàng: mỗi loại đồ một bộ dòng riêng. */
export function specOf(l:Line):Spec{
 const b=bodyOf(l),fee=deliveryFee([l]);
 const ship:SpecRow={icon:'bus',label:'Phí giao (đặt điện thoại)',value:money(fee)};
 const weight:SpecRow={icon:'box',label:'Cân nặng',value:kgText(b.kg)};
 const size:SpecRow={icon:'grid',label:'Kích thước',value:sizeText(b.cm)};
 if(l.kind==='home'){
  const t=HOME_TIERS[l.tier],rows:SpecRow[]=[size,weight];
  if(b.watt)rows.push({icon:'bolt',label:'Điện năng',value:`${b.watt} W`});
  rows.push({icon:'moon',label:'Bớt căng thẳng',value:t.comfort>0?`−${t.comfort}/đêm`:'Không'},ship);
  return{title:homeName(l.id,l.tier),kind:'furniture',rows};
 }
 const p=PRODUCTS[l.id];
 if(p.category==='electronics')return{title:p.name,kind:'electronics',rows:[{icon:'bolt',label:'Điện năng',value:`${b.watt??0} W`},{icon:'play',label:'Tác dụng',value:p.effect},weight,size,ship]};
 if(p.category==='transport'){
  const m=MODES[l.id==='bicycle'?'bicycle':'motorbike'];
  const run:SpecRow=l.id==='bicycle'?{icon:'coin',label:'Chi phí chạy',value:'Không tốn tiền'}:{icon:'coin',label:'Chi phí chạy',value:`${money(m.farePerKm)}/km, gửi xe ${money(m.parkFee)}`};
  return{title:p.name,kind:'transport',rows:[{icon:'arrow',label:'Tốc độ',value:`${m.kmh} km/h`},{icon:'clock',label:'Tác dụng',value:p.effect},run,weight,size,ship]};
 }
 if(p.category==='bag')return{title:p.name,kind:'bag',rows:[{icon:'bag',label:'Tác dụng',value:p.effect},weight,size,ship]};
 return{title:p.name,kind:'clothing',rows:[{icon:'smile',label:'Tác dụng',value:p.effect},weight,size,ship]};
}
