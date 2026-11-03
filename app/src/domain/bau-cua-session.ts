import {playBauCua, type Bets, type Dice, type RoundResult} from './bau-cua';
import type {GameState} from './types';
export const SHAKE_DURATION = 1100;
// The session belongs to App, so closing the phone cannot settle a round early
// or start a second one. No wallet, ledger or save mutation happens before finish.
export function createBauCuaSession(
 read:()=>GameState,
 commit:(state:GameState)=>void,
 onBusy:(busy:boolean)=>void,
 schedule:(callback:()=>void,delay:number)=>ReturnType<typeof setTimeout> = setTimeout,
 unschedule:(timer:ReturnType<typeof setTimeout>)=>void = clearTimeout,
 roll?:()=>Dice,
) {
 let pending: {timer:ReturnType<typeof setTimeout>;resolve:(result:RoundResult)=>void}|null = null;
 const play=(bets:Bets):Promise<RoundResult>=>{
  if(pending)return Promise.resolve({ok:false,error:'Đợi ván đang xóc kết thúc nhé.'});
  const captured={...bets};
  return new Promise(resolve=>{
   const timer=schedule(()=>{
    if(!pending)return;
    try {
     const result=playBauCua(read(),captured,roll);
     if(result.ok)commit(result.state);
     resolve(result);
    } catch {resolve({ok:false,error:'Chưa hoàn tất ván chơi. Hãy thử lại.'})}
    finally {pending=null;onBusy(false)}
   },SHAKE_DURATION);
   pending={timer,resolve};onBusy(true);
  });
 };
 const cancel=()=>{if(!pending)return;const {timer,resolve}=pending;pending=null;unschedule(timer);onBusy(false);resolve({ok:false,error:'Ván chơi đã dừng.'})};
 return {play,cancel};
}
