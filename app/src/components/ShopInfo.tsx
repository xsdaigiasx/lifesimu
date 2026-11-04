import {useState} from 'react';
import type {Spec} from '../domain/specs';
import Icon from './Icon';

/** Nút "i" trong ô tròn ở góc ảnh thẻ đồ; bấm mở bảng thông tin chi tiết theo loại đồ. */
export function InfoButton({spec}:{spec:Spec}){
 const [open,setOpen]=useState(false);
 return <>
  <button type="button" className="info-dot" aria-label={'Thông tin '+spec.title.toLocaleLowerCase('vi')} onClick={e=>{e.stopPropagation();setOpen(true)}}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="7.3" r="1.5" fill="currentColor"/><path fill="currentColor" d="M9.6 10.4h3.7v6.3h1.7v1.6H9.2v-1.6h1.7v-4.7H9.6z"/></svg></button>
  {open&&<SpecSheet spec={spec} onClose={()=>setOpen(false)}/>}
 </>;
}

/** Bảng thông tin dưới đáy màn: tên to đậm, mỗi dòng một biểu tượng, nhãn và số liệu. */
export function SpecSheet({spec,onClose}:{spec:Spec;onClose:()=>void}){
 return <div className="qty-backdrop" role="presentation" onClick={onClose}>
  <section className="info-sheet" role="dialog" aria-label={spec.title} onClick={e=>e.stopPropagation()}>
   <header><strong className="t-title">{spec.title}</strong><button type="button" className="info-close" aria-label="Đóng" onClick={onClose}><Icon name="close"/></button></header>
   <dl>{spec.rows.map(r=><div key={r.label}><dt><Icon name={r.icon}/>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
  </section>
 </div>;
}
