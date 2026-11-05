import type {GameState,GameResult} from '../domain/types';
import {policyOf,POL} from '../domain/policy';
import type {MgAction} from '../domain/manage';
import {GameScreen} from './GameUI';

const ROWS:[ 'overtime'|'remote'|'perk', string, string ][]=[
 ['overtime','Làm thêm giờ',`Tốc độ +${Math.round((POL.overtimeSpeed-1)*100)}%, mệt hơn, giảm gắn bó`],
 ['remote','Làm từ xa',`Tốc độ −${Math.round((1-POL.remoteSpeed)*100)}%, đỡ mệt, vui hơn`],
 ['perk','Phúc lợi',`Lương quỹ +${Math.round((POL.perkWage-1)*100)}%, gắn bó và tinh thần tăng dần`]];
/** T49: chính sách công ty, bật hoặc tắt, có hiệu lực từ hôm sau. */
export default function Policy({state,onAction,onBack}:{state:GameState;onAction:(a:MgAction)=>GameResult;onBack:()=>void}){
 const p=policyOf(state.company);
 return <GameScreen title="Chính sách" onBack={onBack}>
  <div className="game-answer-list">
   {ROWS.map(([k,name,note])=><button key={k} aria-pressed={!!p[k]} className={p[k]?'on':''} onClick={()=>onAction({kind:'mgPolicy',key:k,value:!p[k]})}><b>{p[k]?'✓':''}</b><span>{name}<small>{note}</small></span></button>)}
  </div>
  <h4 className="finance-head">Văn hoá báo lỗi</h4>
  <div className="game-button-pair">
   {([['open','Thẳng thắn'],['closed','Kín']] as const).map(([v,l])=><button key={v} className={p.candor===v?'primary':'game-secondary'} onClick={()=>onAction({kind:'mgPolicy',key:'candor',value:p.candor===v?null:v})}>{l}</button>)}
  </div></GameScreen>}
