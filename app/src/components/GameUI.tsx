import type {ReactNode} from 'react';
import Icon from './Icon';
/** Thông tin phụ dạng biểu tượng kèm số (nguyên tắc giao diện 04/11). */
export type Fact=[icon:string,text:string];
const FACT_NAME:Record<string,string>={clock:'Thời gian',bolt:'Năng lượng',wave:'Căng thẳng',heart:'Sức khỏe',coin:'Chi phí',cups:'Hôm nay',lock:'Cần có',smile:'Tinh thần',box:'Trong kho'};
export function Facts({items}:{items:Fact[]}){return <span className="game-facts">{items.map(([icon,text],i)=><span key={i} title={FACT_NAME[icon]} aria-label={`${FACT_NAME[icon]??''} ${text}`}><Icon name={icon}/>{text}</span>)}</span>}
export function ActionRow({icon,label,value,facts,onClick,disabled=false}:{icon:string;label:string;value?:string;facts?:Fact[];onClick:()=>void;disabled?:boolean}){return <button className="game-action-row" disabled={disabled} onClick={onClick}><span className="game-row-icon"><Icon name={icon}/></span><span className="game-row-copy"><strong>{label}</strong>{facts?<Facts items={facts}/>:value&&<small>{value}</small>}</span><span className="game-row-arrow"><Icon name="chevron-right"/></span></button>}
export function GameScreen({title,onBack,children,footer}:{title:string;onBack:()=>void;children:ReactNode;footer?:ReactNode}){return <section className="game-screen"><header className="game-screen-head"><button onClick={onBack} aria-label="Quay lại"><Icon name="chevron-left"/></button><h3>{title}</h3></header><div className="game-screen-content">{children}</div>{footer&&<footer className="game-screen-footer">{footer}</footer>}</section>}
export function DataRow({label,value}:{label:string;value:ReactNode}){return <div className="game-data-row"><span>{label}</span><strong>{value}</strong></div>}
