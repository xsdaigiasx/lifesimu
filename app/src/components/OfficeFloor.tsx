import type {DecorId,OfficeSize,Industry} from '../domain/office';
import {INDUSTRIES} from '../domain/office';
/** Deterministic editable floor plan, separate objects rather than baked-in furniture. */
export default function OfficeFloor({size,industry,level,printer,decor,employee,selected,onPlace}:{size:OfficeSize;industry:Industry;level:number;printer:number;decor:Partial<Record<DecorId,number|null>>;employee:boolean;selected:DecorId|null;onPlace:(slot:number)=>void}){
 const count=size==='small'?6:size==='medium'?12:24,columns=size==='small'?3:6,rows=count/columns;
 const desks=Array.from({length:count},(_,i)=>({x:95+i%columns*(size==='small'?135:76),y:99+Math.floor(i/columns)*66}));
 const slots=[{x:52,y:115,label:employee?'Cạnh bàn':'Cửa sổ'},{x:565,y:120,label:employee?'Kệ cá nhân':'Khu làm việc'},{x:535,y:365,label:employee?'Góc bàn':'Tiếp khách'}];
 const color=INDUSTRIES[industry].color;
 return <div className="office-plan"><svg viewBox="0 0 640 450" role="img" aria-label={`Sơ đồ văn phòng ${size==='small'?'6':size==='medium'?'12':'24'} chỗ, máy tính cấp ${level}${selected?', đang chọn vị trí đặt đồ':''}`}>
 <defs><pattern id="office-floor" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#e5ddc6"/><path d="M40 0H0V40" fill="none" stroke="#d4cbb3" strokeWidth="1"/></pattern><linearGradient id="office-screen" x2="1" y2="1"><stop stopColor={color}/><stop offset="1" stopColor="#acc9bd"/></linearGradient></defs>
 <rect x="16" y="24" width="608" height="410" rx="18" fill="#b6beac"/>
 <rect x="20" y="18" width="600" height="410" rx="16" fill="#f4f1df" stroke="#faf7eb" strokeWidth="6"/>
 <rect x="30" y="42" width="580" height="372" fill="url(#office-floor)"/>
 <path d="M30 42V410H610V42" fill="none" stroke="#b8c4b1" strokeWidth="8"/>
 {[90,210,330,450].map(x=><g key={x}><rect x={x} y="22" width="86" height="24" rx="3" fill="#c7dbd6" stroke="#91aaa0" strokeWidth="3"/><path d={`M${x+43} 24v20`} stroke="#f7f5e3" strokeWidth="3"/></g>)}
 <path d="M46 50 89 50 160 200 70 200Z" fill="#fff7c7" opacity=".25"/>
 {desks.map((p,i)=>{const deviceLevel=employee&&i>0?(size==='large'?3:size==='medium'?2:1):level;return <g key={i} opacity={employee&&i>0?.73:1} transform={`translate(${p.x} ${p.y})`}>
 <ellipse cx="10" cy="21" rx="29" ry="7" fill="#617460" opacity=".13"/>
 <rect x="-24" y="-22" width="61" height="33" rx="4" fill={i===0&&employee?'#e2b56d':'#c7aa79'} stroke={i===0&&employee?'#4e735d':'#a98c62'} strokeWidth={i===0&&employee?3:1}/>
 <rect x="-10" y="-19" width={deviceLevel===3?35:27} height="18" rx="2" fill="#486562"/>
 <rect x="-7" y="-17" width={deviceLevel===3?29:21} height="13" rx="1" fill="url(#office-screen)"/>
 {deviceLevel>=2&&<path d="M-5-14h11m-11 3h15m-15 3h8" stroke="#e4f0d4" strokeWidth="1" opacity=".8"/>}
 <rect x="-4" y="3" width="24" height="5" rx="1" fill="#f4eddc"/><circle cx="28" cy="5" r="3" fill="#f4eddc"/>
 <rect x="-3" y="16" width="24" height="19" rx="6" fill={color} stroke="#f7f2dd" strokeWidth="2"/>
 {i===0&&employee&&<text x="9" y="51" textAnchor="middle" fontSize="9" fill="#365d47">Bàn của bạn</text>}
 </g>})}
 {rows<4&&<><path d="M62 269H488" stroke="#b6c1ab" strokeWidth="4"/><rect x="84" y="306" width="142" height="47" rx="22" fill="#baa47e" stroke="#ac956f" strokeWidth="2"/>{[90,136,184,222].map(x=><rect key={x} x={x} y="287" width="24" height="16" rx="5" fill={color}/>) }<text x="155" y="335" fontSize="10" textAnchor="middle" fill="#fff9e8">Bàn họp</text></>}
 <g transform="translate(402 360)">{industry==='tech'?<><rect width="52" height="38" rx="3" fill="#607b79"/>{[7,17,27].map(y=><g key={y}><path d={`M5 ${y}h31`} stroke="#a8c2b4" strokeWidth="3"/><circle cx="44" cy={y} r="2" fill="#c8db97"/></g>)}<text x="26" y="51" textAnchor="middle" fontSize="8" fill="#63765f">Máy chủ</text></>:industry==='design'?<><rect width="62" height="36" rx="3" fill="#c7b18e"/>{['#9db6b0','#dbb882','#c49788','#84936d'].map((c,i)=><rect key={i} x={5+i*14} y="6" width="10" height="24" fill={c}/>)}<text x="31" y="49" textAnchor="middle" fontSize="8" fill="#63765f">Bảng ý tưởng</text></>:industry==='trade'?<><rect width="68" height="36" rx="3" fill="#bca782"/>{[0,1,2].map(i=><rect key={i} x={5+i*21} y="6" width="16" height="25" fill="#ddc497" stroke="#a98e68"/>)}<text x="34" y="49" textAnchor="middle" fontSize="8" fill="#63765f">Kệ sản phẩm</text></>:<><rect width="62" height="36" rx="3" fill="#a3b29b"/>{[0,1,2,3,4].map(i=><rect key={i} x={5+i*11} y="5" width="8" height="27" fill={i%2?'#f1e6c9':'#7f9186'}/>)}<text x="31" y="49" textAnchor="middle" fontSize="8" fill="#63765f">Tủ hồ sơ</text></>}</g>
 <rect x="65" y="371" width="184" height="30" rx="5" fill="#c9ad7b"/><text x="157" y="391" textAnchor="middle" fontSize="10" fill="#5c654f">Lễ tân, {INDUSTRIES[industry].name}</text>
 <path d="M300 413h55m-55-1v-45q43 0 43 44" fill="#f5eedb" stroke="#8b9f89" strokeWidth="2"/>
 {printer>0&&<g transform="translate(540 282)"><rect x="-18" y="-15" width="38" height="36" rx="4" fill="#faf9ee" stroke="#879a8b" strokeWidth="2"/><rect x="-11" y="-25" width="24" height="20" fill="#fffdf1" stroke="#b6c1ad"/><path d="M-10 3h22m-22 5h22" stroke="#738c82" strokeWidth="2"/>{printer===2&&<circle cx="12" cy="-7" r="3" fill="#bca86e"/>}<text x="0" y="38" textAnchor="middle" fontSize="9" fill="#5b705c">Máy in {printer===2?'đa năng':''}</text></g>}
 {slots.map((p,i)=>{const item=(Object.entries(decor) as [DecorId,number|null][]).find(([,slot])=>slot===i)?.[0];return <g key={i} transform={`translate(${p.x} ${p.y})`}>
 {item==='plant'&&<><ellipse cy="12" rx="16" ry="6" fill="#9b8262"/><path d="M-12 0h24l-3 17H-9Z" fill="#bc9472"/><ellipse cy="-9" rx="17" ry="13" fill="#70916b"/><ellipse cx="-9" cy="-14" rx="10" ry="14" fill="#91ab73"/><ellipse cx="8" cy="-16" rx="10" ry="16" fill="#658761"/></>}
 {item==='lamp'&&<><ellipse cy="17" rx="15" ry="5" fill="#819381"/><path d="M0 15v-29l12-8" stroke="#7c8979" strokeWidth="3" fill="none"/><path d="m5-26 17 4-4 11-20-5Z" fill="#c4b779"/><ellipse cx="8" cy="-13" rx="12" ry="5" fill="#f3df9f" opacity=".7"/></>}
 {item==='coffee'&&<><rect x="-23" y="-15" width="46" height="40" rx="4" fill="#b39c76"/><rect x="-16" y="-28" width="25" height="24" rx="3" fill="#5e7973"/><rect x="-10" y="-13" width="12" height="9" fill="#eae5d3"/><circle cx="15" cy="-5" r="5" fill="#fbf7e7"/></>}
 </g>})}
 </svg>{selected&&<div className="office-placement" aria-label="Chọn vị trí đặt đồ">{slots.map((s,i)=><button key={i} onClick={()=>onPlace(i)}>{s.label}</button>)}</div>}
 </div>
}
