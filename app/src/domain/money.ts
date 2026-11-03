import type {GameState} from './types';
// Cổng duy nhất để đổi tiền: kiểm tra số nguyên, không âm, trần 1e12, ghi sổ và chống ghi trùng theo mã giao dịch.
export const MONEY_CAP=1e12;
export const TX_KEEP=400;
export const TX_ID=/^[A-Za-z0-9_.:-]{1,120}$/;
export interface Tx{id?:string;name:string;amount:number}
export type PostCode='ok'|'duplicate'|'short'|'cap'|'invalid';
// Sửa trực tiếp `n`, nên chỉ gọi trên bản sao do chính hàm gọi sở hữu.
export function post(n:GameState,tx:Tx):PostCode{
 if(!Number.isSafeInteger(tx.amount)||typeof tx.name!=='string'||!tx.name)return 'invalid';
 if(tx.amount===0)return 'ok';
 const seq=n.txSeq??0,id=tx.id??`t:${n.day}:${seq}`;
 if(!TX_ID.test(id))return 'invalid';
 if(n.txIds?.includes(id))return 'duplicate';
 const next=n.money+tx.amount;
 if(next<0)return 'short';
 if(next>MONEY_CAP)return 'cap';
 n.money=next;
 n.ledger=[{name:tx.name,amount:tx.amount,day:n.day},...n.ledger].slice(0,100);
 n.txIds=[...(n.txIds??[]),id].slice(-TX_KEEP);
 n.txSeq=seq+1;
 return 'ok';
}
export const posted=(s:GameState,id:string)=>!!s.txIds?.includes(id);
export const validTx=(s:GameState)=>(s.txIds===undefined||Array.isArray(s.txIds)&&s.txIds.length<=TX_KEEP&&s.txIds.every(x=>typeof x==='string'&&TX_ID.test(x)))&&(s.txSeq===undefined||Number.isSafeInteger(s.txSeq)&&s.txSeq>=0);
