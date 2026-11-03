/** Bắt đầu đời mới: xoá ba khoá save nhưng luôn giữ một bản sao lưu 7 ngày để khôi phục. */
export const SAVE_KEYS=['life-simulator-vi-v1','life-simulator-phone-v1','life-simulator-profile-v1'] as const;
export const BACKUP_KEY='life-simulator-vi-backup-v1',BACKUP_DAYS=7,DAY_MS=86400000;
export interface StorageLike{getItem(k:string):string|null;setItem(k:string,v:string):void;removeItem(k:string):void}
export interface BackupInfo{name:string;day:number;money:number;savedAt:number;daysLeft:number}
interface Backup{v:1;savedAt:number;name:string;day:number;money:number;data:Record<string,string>}
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:0;
const readData=(st:StorageLike)=>{const data:Record<string,string>={};for(const k of SAVE_KEYS){const raw=st.getItem(k);if(raw!==null)data[k]=raw}return data};
const parse=(raw:string|null):Backup|null=>{if(!raw)return null;try{const b=JSON.parse(raw);if(b?.v!==1||typeof b.data!=='object'||!b.data||typeof b.data[SAVE_KEYS[0]]!=='string'||!Number.isFinite(b.savedAt))return null;return{v:1,savedAt:b.savedAt,name:typeof b.name==='string'?b.name.slice(0,40):'',day:num(b.day),money:num(b.money),data:b.data}}catch{return null}};
const describe=(data:Record<string,string>)=>{let name='',day=0,money=0;try{const s=JSON.parse(data[SAVE_KEYS[0]]);day=num(s.day);money=num(s.money)}catch{}try{const p=JSON.parse(data[SAVE_KEYS[2]]);if(typeof p.name==='string')name=p.name}catch{}return{name,day,money}};
/** Chép đời hiện tại vào ô sao lưu (ghi đè bản cũ). Trả false nếu chưa có gì để chép. */
export function archiveCurrent(st:StorageLike,now:number):boolean{const data=readData(st);if(!data[SAVE_KEYS[0]])return false;const b:Backup={v:1,savedAt:now,data,...describe(data)};st.setItem(BACKUP_KEY,JSON.stringify(b));return true}
/** Sao lưu rồi xoá. Nếu sao lưu thất bại thì không xoá gì và trả false. */
export function resetLife(st:StorageLike,now:number):boolean{try{if(!archiveCurrent(st,now)&&readData(st)[SAVE_KEYS[0]])return false}catch{return false}for(const k of SAVE_KEYS)st.removeItem(k);return true}
export function backupInfo(st:StorageLike,now:number):BackupInfo|null{const b=parse(st.getItem(BACKUP_KEY));if(!b)return null;const left=Math.ceil((b.savedAt+BACKUP_DAYS*DAY_MS-now)/DAY_MS);if(left<=0){st.removeItem(BACKUP_KEY);return null}return{name:b.name,day:b.day,money:b.money,savedAt:b.savedAt,daysLeft:Math.min(BACKUP_DAYS,left)}}
/** Khôi phục: đời hiện tại (nếu có) trở thành bản sao lưu mới nên không mất gì. */
export function restoreBackup(st:StorageLike,now:number):boolean{if(!backupInfo(st,now))return false;const b=parse(st.getItem(BACKUP_KEY))!;const hadCurrent=!!readData(st)[SAVE_KEYS[0]];if(hadCurrent)archiveCurrent(st,now);else st.removeItem(BACKUP_KEY);for(const k of SAVE_KEYS){if(b.data[k]!==undefined)st.setItem(k,b.data[k]);else st.removeItem(k)}return true}
