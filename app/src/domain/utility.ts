/** T54 (chủ dự án duyệt 05/11): điện nước theo đồ đang đặt trong nhà, không có công tắc.
 * Điện = công suất × giờ dùng cố định × 30 ngày; giá trọ cao hơn nhà riêng (nhà riêng tính bậc thang). */
import type {GameState} from './types';
import {homeOf,livesInTro,type HomeId,type HomeTier} from './home';
import {housingOf,layoutOf,HOUSES,type HouseId} from './housing';

type Watts=Record<HomeTier,number>;
/** Thiết bị tốn điện: công suất (W) theo hạng và số giờ dùng mỗi ngày. Các đồ còn lại không tốn điện. */
export const DEVICES:Partial<Record<HomeId,{name:string;watt:Watts;hours:number}>>={
 fridge:{name:'Tủ lạnh',watt:{basic:70,comfort:90,premium:110},hours:24},
 desk:{name:'Bàn laptop',watt:{basic:45,comfort:55,premium:70},hours:6},
 lamp:{name:'Đèn',watt:{basic:5,comfort:7,premium:9},hours:6}};
export const TV={name:'TV',watt:60,hours:4};
export const DAYS_PER_MONTH=30;
/** Giá điện (đồng/kWh): phòng trọ một giá cao; nhà riêng theo bậc, mỗi bậc tính cho phần kWh trong bậc đó. */
export const TRO_RATE=3500;
export const TIERS:[upTo:number,rate:number][]=[[50,2000],[100,2500],[200,3000],[Infinity,3500]];
/** Nước và mạng mỗi tháng theo loại nhà (đồng). */
export const WATER:Record<HouseId,number>={tro:60000,townhouse:120000,villa:250000};
export const NET:Record<HouseId,number>={tro:150000,townhouse:180000,villa:250000};

export interface BillLine{id:string;label:string;kwh:number;amount:number}
export interface Bill{electricity:BillLine[];water:number;net:number;kwh:number;total:number}

const kwhOf=(watt:number,hours:number)=>Math.round(watt*hours*DAYS_PER_MONTH/1000*10)/10;
export const rateFor=(house:HouseId)=>house==='tro'?((kwh:number)=>kwh*TRO_RATE):((kwh:number)=>{let left=kwh,from=0,sum=0;for(const[up,rate]of TIERS){const part=Math.min(left,up-from);if(part<=0)break;sum+=part*rate;left-=part;from=up}return sum});

/** Đồ đang đặt trong nhà hiện tại (id và hạng). Phòng trọ lấy theo ô đặt; nhà lớn lấy theo mặt bằng các tầng. */
export function placedDevices(s:GameState):{id:HomeId;tier:HomeTier}[]{
 const h=housingOf(s),items=homeOf(s).items;
 if(livesInTro(s))return items.filter(i=>i.placed).map(i=>({id:i.id,tier:i.tier??'basic'}));
 const tier=(id:HomeId)=>items.find(i=>i.id===id)?.tier??'basic';
 return HOUSES[h.house].floors.flatMap(f=>layoutOf(s,h.house,f.id)).map(p=>({id:p.id,tier:tier(p.id)}))}

/** Hoá đơn điện nước, mạng của một tháng theo nhà và đồ hiện có. */
export function billOf(s:GameState):Bill{
 const house=housingOf(s).house,lines:BillLine[]=[];
 for(const d of placedDevices(s)){const spec=DEVICES[d.id];if(!spec)continue;const kwh=kwhOf(spec.watt[d.tier],spec.hours),i=lines.find(l=>l.id===d.id);if(i)i.kwh=Math.round((i.kwh+kwh)*10)/10;else lines.push({id:d.id,label:spec.name,kwh,amount:0})}
 if(s.life?.owned.includes('tv'))lines.push({id:'tv',label:TV.name,kwh:kwhOf(TV.watt,TV.hours),amount:0});
 const kwh=Math.round(lines.reduce((n,l)=>n+l.kwh,0)*10)/10,price=rateFor(house),total=Math.round(price(kwh)/1000)*1000;
 /** Chia tiền điện theo tỷ lệ kWh của từng thiết bị, làm tròn nghìn; dòng cuối nhận phần dư để cộng đúng tổng. */
 let left=total;lines.forEach((l,i)=>{const a=i===lines.length-1?left:Math.round(total*l.kwh/(kwh||1)/1000)*1000;l.amount=a;left-=a});
 const water=WATER[house],net=NET[house];
 return{electricity:lines.sort((a,b)=>b.kwh-a.kwh),water,net,kwh,total:total+water+net}}

