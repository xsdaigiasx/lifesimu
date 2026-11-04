import {useState} from 'react';
import type {Spec} from '../domain/specs';
import Icon from './Icon';

/** Nút "i" trong ô tròn ở góc ảnh thẻ đồ; bấm mở bảng thông tin chi tiết theo loại đồ. */
export function InfoButton({spec}:{spec:Spec}){
 const [open,setOpen]=useState(false);
 return <>
  <button type="button" className="info-dot" aria-label={'Thông tin '+spec.title.toLocaleLowerCase('vi')} onClick={e=>{e.stopPropagation();setOpen(true)}}>i</button>
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
