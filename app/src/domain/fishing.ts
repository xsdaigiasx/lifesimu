import {spendTime} from './time';
import type {GameState,GameResult,Place} from './types';
export const FISH_IDS=['tilapia','carp','snakehead','catfish','grasscarp','redtilapia'] as const;
export type FishId=typeof FISH_IDS[number];
export const FISH:Record<FishId,{name:string;atlas:number;rarity:string;min:number;max:number;price:number;weight:number}>={
 tilapia:{name:'Cá rô phi',atlas:0,rarity:'Phổ biến',min:250,max:1400,price:40000,weight:32},
 carp:{name:'Cá chép',atlas:1,rarity:'Phổ biến',min:400,max:2200,price:65000,weight:25},
 snakehead:{name:'Cá lóc',atlas:2,rarity:'Ít gặp',min:450,max:2500,price:85000,weight:15},
 catfish:{name:'Cá trê',atlas:3,rarity:'Ít gặp',min:350,max:1800,price:55000,weight:12},
 grasscarp:{name:'Cá trắm cỏ',atlas:4,rarity:'Hiếm',min:1200,max:4500,price:75000,weight:10},
 redtilapia:{name:'Cá diêu hồng',atlas:5,rarity:'Hiếm',min:500,max:2000,price:90000,weight:6},
};
export interface FishCatch {id:number;fish:FishId;grams:number;value:number;day:number}
export interface FishingState {atLake:boolean;bait:number;trips:number;pendingCast:boolean;nextId:number;basket:FishCatch[];collection:Record<FishId,{caught:number;best:number}>;lastCatch:FishCatch|null}
export const LAKE:Place={id:'lake',name:'Hồ Sen ngoại ô',icon:'fish',x:0,y:0,summary:'Bến câu ven hồ, Tuyến xe buýt 07',detail:'Một hồ câu yên tĩnh ngoài thành phố. Đi tuyến 07 từ trạm xe buýt; cần câu được mượn tại hồ.'};
export const ROUND_TRIP_FARE=40000,BAIT_PRICE=10000;
export function initialFishing():FishingState{return{atLake:false,bait:10,trips:0,pendingCast:false,nextId:1,basket:[],collection:Object.fromEntries(FISH_IDS.map(id=>[id,{caught:0,best:0}])) as FishingState['collection'],lastCatch:null}}
export const fishingOf=(state:GameState):FishingState=>state.fishing??initialFishing();
const integer=(n:unknown,max:number)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=max;
export function validFishing(value:unknown,day:number):value is FishingState {
 if(!value||typeof value!=='object')return false;const f=value as FishingState;
 const validCatch=(c:FishCatch)=>c&&integer(c.id,1e9)&&c.id>0&&c.id<f.nextId&&FISH_IDS.includes(c.fish)&&integer(c.grams,4500)&&c.grams>=FISH[c.fish].min&&c.grams<=FISH[c.fish].max&&integer(c.value,1e6)&&c.value===fishValue(c.fish,c.grams)&&integer(c.day,day);
 return typeof f.atLake==='boolean'&&typeof f.pendingCast==='boolean'&&(!f.pendingCast||f.atLake)&&integer(f.bait,999)&&integer(f.trips,1e6)&&integer(f.nextId,1e9)&&f.nextId>0&&Array.isArray(f.basket)&&f.basket.length<=60&&f.basket.every(validCatch)&&new Set(f.basket.map(c=>c.id)).size===f.basket.length&&!!f.collection&&FISH_IDS.every(id=>{const c=f.collection[id];return c&&integer(c.caught,1e9)&&integer(c.best,FISH[id].max)&&(c.caught===0?c.best===0:c.best>=FISH[id].min)})&&(f.lastCatch===null||validCatch(f.lastCatch));
}
function ledger(state:GameState,name:string,amount:number):GameState{return{...state,money:state.money+amount,ledger:[{name,amount,day:state.day},...state.ledger].slice(0,100)}}
export function takeBus(state:GameState,toLake:boolean):GameResult {
 const f=fishingOf(state);if(f.atLake===toLake)return{ok:false,error:'Bạn đã ở điểm đến này.'};
 if(toLake&&state.money<ROUND_TRIP_FARE)return{ok:false,error:'Cần 40.000đ cho vé khứ hồi. Lượt về đã được bao gồm.'};
 if(f.trips>=1e6)return{ok:false,error:'Đã tới giới hạn số chuyến.'};
 const timed=spendTime(state,45,toLake?'lake':'bus');if(!timed.ok)return timed;state=timed.state;
 const n=toLake?ledger(state,'Xe buýt 07, Vé khứ hồi Hồ Sen',-ROUND_TRIP_FARE):state;
 return{ok:true,state:{...n,fishing:{...f,atLake:toLake,trips:f.trips+(toLake?1:0),pendingCast:false}}};
}
export function buyBait(state:GameState):GameResult {
 const f=fishingOf(state);if(!f.atLake)return{ok:false,error:'Mua mồi tại quầy ở Hồ Sen.'};
 if(state.money<BAIT_PRICE)return{ok:false,error:'Chưa đủ 10.000đ mua mồi.'};
 if(f.bait>989)return{ok:false,error:'Hộp mồi đã đầy.'};
 const timed=spendTime(state,5);if(!timed.ok)return timed;state=timed.state;
 return{ok:true,state:{...ledger(state,'Hồ Sen, Mua 10 mồi câu',-BAIT_PRICE),fishing:{...f,bait:f.bait+10}}};
}
export function castLine(state:GameState):GameResult {
 const f=fishingOf(state);if(!f.atLake)return{ok:false,error:'Hãy đi xe buýt tới Hồ Sen trước.'};
 if(f.pendingCast)return{ok:false,error:'Cần câu vẫn đang ở dưới nước.'};
 if(f.basket.length>=60)return{ok:false,error:'Giỏ đã đầy. Hãy bán cá trước.'};
 if(f.bait<1)return{ok:false,error:'Hết mồi. Mua thêm ở quầy ven hồ nhé.'};
 if(state.energy<2)return{ok:false,error:'Bạn cần ít nhất 2 năng lượng để câu.'};
 if(f.nextId>=1e9)return{ok:false,error:'Đã tới giới hạn số lượt câu.'};
 const timed=spendTime(state,10);if(!timed.ok)return timed;state=timed.state;
 return{ok:true,state:{...state,energy:state.energy-2,fishing:{...f,bait:f.bait-1,pendingCast:true}}};
}
export const fishValue=(id:FishId,grams:number)=>Math.round(FISH[id].price*grams/1000/1000)*1000;
const randomUnit=()=>{const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]/4294967296};
export function finishCast(state:GameState,success:boolean,random:()=>number=randomUnit):GameResult {
 const f=fishingOf(state);if(!f.atLake||!f.pendingCast)return{ok:false,error:'Không có lượt câu đang chờ.'};
 if(!success)return{ok:true,state:{...state,fishing:{...f,pendingCast:false}}};
 const pick=random(),size=random();if(!Number.isFinite(pick)||pick<0||pick>=1||!Number.isFinite(size)||size<0||size>=1)return{ok:false,error:'Không xác định được cá. Hãy thử lại.'};
 let ticket=pick*100,fish:FishId='redtilapia';for(const id of FISH_IDS){ticket-=FISH[id].weight;if(ticket<0){fish=id;break}}
 const info=FISH[fish],grams=Math.round((info.min+(info.max-info.min)*size)/10)*10;
 const caught:FishCatch={id:f.nextId,fish,grams,value:fishValue(fish,grams),day:state.day},record=f.collection[fish];
 return{ok:true,state:{...state,xp:Math.min(1e9,state.xp+3),mood:Math.min(100,state.mood+1),fishing:{...f,pendingCast:false,nextId:f.nextId+1,basket:[...f.basket,caught],lastCatch:caught,collection:{...f.collection,[fish]:{caught:Math.min(1e9,record.caught+1),best:Math.max(record.best,grams)}}}}};
}
export function sellFish(state:GameState):GameResult {
 const f=fishingOf(state),value=f.basket.reduce((sum,fish)=>sum+fish.value,0);
 if(!f.atLake||!f.basket.length)return{ok:false,error:'Chưa có cá trong giỏ để bán ở hồ.'};
 if(state.money+value>1e12)return{ok:false,error:'Số dư đã tới giới hạn.'};
 const timed=spendTime(state,5);if(!timed.ok)return timed;state=timed.state;
 return{ok:true,state:{...ledger(state,`Hồ Sen, Bán ${f.basket.length} cá`,value),fishing:{...f,basket:[]}}};
}

export const aimPosition=(milliseconds:number)=>{const t=(milliseconds%2400)/1200;return(t<=1?t:2-t)*100};
export const canLand=(position:number)=>position>=32&&position<=72;
