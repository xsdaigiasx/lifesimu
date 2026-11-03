import type {GameState} from '../domain/types';
export default function WorkActivity({drawing}:{state:GameState;drawing:boolean}){return <div className="static-work"><img src="/assets/static-scenes/work.webp" alt={drawing?'Đang thiết kế trên máy tính':'Đang lập trình trên máy tính'}/></div>}
