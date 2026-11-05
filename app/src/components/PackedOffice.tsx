import type {GameState} from '../domain/types';
import {castById,coworkerId} from '../domain/npc';
/** Ảnh tĩnh văn phòng khi đi làm thuê (chốt 04/11): isometric để dành cho lúc mở công ty.
 * Khung nhìn cắt quanh hai bàn có người để trên điện thoại vẫn thấy cả hai; điểm chạm đặt đúng chỗ người trong ảnh. */
const VIEW={x:600,w:900},SEATS=[{desk:'dev' as const,x:887,y:180},{desk:'design' as const,x:1200,y:220}];
export default function PackedOffice({state,onNpc,afternoon}:{state:GameState;onNpc?:(id:string)=>void;focusPlayer?:boolean;afternoon?:boolean}){
 const people=SEATS.map(p=>{const n=castById(state,coworkerId(state.office?.employerId,p.desk));return{...p,id:n?.id??p.desk,name:n?.name??''}});
 return <div className="static-office"><svg className="static-office-svg" viewBox={`${VIEW.x} 0 ${VIEW.w} 1024`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Văn phòng IT với bàn làm việc của bạn và đồng nghiệp">
  <image href="/assets/static-scenes/office.webp" x={0} y={0} width={1536} height={1024}/>
  {afternoon&&<rect className="static-afternoon" x={0} y={0} width={1536} height={1024}/>}
  {onNpc&&people.map(p=><g key={p.id} className="static-person" role="button" tabIndex={0} aria-label={p.name} onClick={()=>onNpc(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onNpc(p.id)}}}>
   <circle cx={p.x} cy={p.y+40} r={70} className="static-person-hit"/>
   <circle cx={p.x} cy={p.y+10} r={46} className="static-person-ring"/>
   <rect x={p.x-74} y={p.y-104} width={148} height={46} rx={23} className="static-person-tag"/><text x={p.x} y={p.y-72} textAnchor="middle">{p.name.split(' ').pop()}</text>
  </g>)}
 </svg></div>}
