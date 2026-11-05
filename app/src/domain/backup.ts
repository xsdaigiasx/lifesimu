import {clearAuto} from './autosave';
import {SAVE_KEYS,archiveCurrent,type StorageLike} from './reset';
import {engine} from './engine';
import {phoneData} from './phone-data';
import {parseProfile} from './profile';

/** Sao lưu save ra tệp mã hoá (AES-GCM) và nhập lại. Tệp bị sửa tay thì không giải mã được, nên không nhập được. */
export const FORMAT=1,APP_ID='next-day',SECRET='next-day:save:v1';
export interface Pack{v:1;savedAt:number;data:Record<string,string>}
export type ImportError='format'|'tamper'|'invalid'|'unsupported';
export const pending=(st:StorageLike)=>SAVE_KEYS.some(k=>st.getItem(k)!==null);

const subtle=()=>{const c=globalThis.crypto;if(!c?.subtle)throw new Error('unsupported');return c};
const b64=(u:Uint8Array)=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s)};
const unb64=(s:string)=>Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
async function keyOf(){const c=subtle(),raw=await c.subtle.digest('SHA-256',new TextEncoder().encode(SECRET));return c.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt'])}
const aad=()=>new TextEncoder().encode(`${APP_ID}:${FORMAT}`);

export function packOf(st:StorageLike,now:number):Pack|null{
 const data:Record<string,string>={};for(const k of SAVE_KEYS){const raw=st.getItem(k);if(raw!==null)data[k]=raw}
 return data[SAVE_KEYS[0]]?{v:1,savedAt:now,data}:null;
}
export async function encryptPack(pack:Pack,day:number):Promise<string>{
 const c=subtle(),iv=c.getRandomValues(new Uint8Array(12)),buf=await c.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad()},await keyOf(),new TextEncoder().encode(JSON.stringify(pack)));
 return JSON.stringify({app:APP_ID,format:FORMAT,day,iv:b64(iv),data:b64(new Uint8Array(buf))});
}
/** Giải mã và kiểm tra bằng validator của game. Trả về gói hợp lệ hoặc mã lỗi. */
export async function decryptPack(text:string):Promise<{ok:true;pack:Pack}|{ok:false;error:ImportError}>{
 let env:{app?:unknown;format?:unknown;iv?:unknown;data?:unknown};
 try{env=JSON.parse(text)}catch{return{ok:false,error:'format'}}
 if(!env||env.app!==APP_ID||typeof env.iv!=='string'||typeof env.data!=='string')return{ok:false,error:'format'};
 if(env.format!==FORMAT)return{ok:false,error:'unsupported'};
 let plain:string;
 try{const c=subtle();plain=new TextDecoder().decode(await c.subtle.decrypt({name:'AES-GCM',iv:unb64(env.iv),additionalData:aad()},await keyOf(),unb64(env.data)))}catch{return{ok:false,error:'tamper'}}
 try{
  const p=JSON.parse(plain) as Pack;
  if(p?.v!==1||!p.data||typeof p.data!=='object'||!Number.isFinite(p.savedAt))return{ok:false,error:'invalid'};
  for(const k of Object.keys(p.data))if(!(SAVE_KEYS as readonly string[]).includes(k)||typeof p.data[k]!=='string')return{ok:false,error:'invalid'};
  const [save,phone,profile]=SAVE_KEYS.map(k=>p.data[k]);
  if(!save||!engine.parse(save))return{ok:false,error:'invalid'};
  if(phone!==undefined&&!phoneData.parse(phone))return{ok:false,error:'invalid'};
  if(profile!==undefined&&!parseProfile(profile))return{ok:false,error:'invalid'};
  return{ok:true,pack:p};
 }catch{return{ok:false,error:'invalid'}}
}
/** Ghi gói vào bộ nhớ. Đời hiện tại được chép sang ô sao lưu 7 ngày trước, nên không mất gì. */
export function applyPack(st:StorageLike,pack:Pack,now:number):boolean{
 try{archiveCurrent(st,now);for(const k of SAVE_KEYS){const v=pack.data[k];if(v===undefined)st.removeItem(k);else st.setItem(k,v)}clearAuto(st);return true}catch{return false}
}
export const ERRORS:Record<ImportError,string>={format:'Đây không phải tệp save của Next Day.',tamper:'Tệp đã bị sửa hoặc hỏng, không đọc được.',invalid:'Save trong tệp không hợp lệ.',unsupported:'Tệp từ phiên bản mới hơn, hãy cập nhật game.'};
export const fileName=(day:number)=>`next-day-ngay-${day+1}.json`;

/** Mở bảng chia sẻ nếu có, không thì tải tệp về. */
export async function shareFile(text:string,name:string):Promise<'shared'|'saved'|'cancel'>{
 const file=new File([text],name,{type:'application/json'});
 try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Save Next Day'});return'shared'}}catch(e){if((e as Error).name==='AbortError')return'cancel'}
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return'saved';
}
