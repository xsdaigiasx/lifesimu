import {HOME_ITEMS,HOME_TIERS,homePrice,homeName,homeOf,type HomeId,type HomeTier} from '../domain/home';
import {PRODUCTS,lifeOf,type ProductId,type LifeAction} from '../domain/life';
import type {GameState,GameResult} from '../domain/types';
import {money} from '../domain/format';
import {useState} from 'react';
import HomeArt from './HomeArt';
import Icon from './Icon';
import {productArt} from './NpcFace';
import {spriteFor} from './furniture-art';
import {FACT} from './MallShop';
type Category='furniture'|'electronics'|'clothing'|'transport';
export default function FurnitureShop({state,onBuy,onLife}:{state:GameState;onBuy:(id:HomeId,tier?:HomeTier)=>GameResult;onLife:(a:LifeAction)=>GameResult}){
 const [notice,setNotice]=useState(''),[category,setCategory]=useState<Category>('furniture');const owned=homeOf(state).items,l=lifeOf(state);
 const run=(r:GameResult,success:string)=>setNotice(r.ok?success:r.error);
 return <section className="furniture-shop" aria-label="Cửa hàng mua sắm"><header className="furniture-shop-balance"><span>Số dư<strong>{money(state.money)}</strong></span><small>{owned.length} món nội thất</small></header><nav className="shop-categories">{([['furniture','Nội thất'],['electronics','Đồ điện tử'],['clothing','Quần áo'],['transport','Phương tiện']] as const).map(([id,name])=><button key={id} aria-pressed={category===id} onClick={()=>{setCategory(id);setNotice('')}}>{name}</button>)}</nav><p className="furniture-shop-status" role="status" hidden={!notice}>{notice}</p>
 <div className="furniture-products">{(Object.keys(HOME_ITEMS) as HomeId[]).filter(id=>category==='furniture'?id!=='lamp'&&id!=='fridge':category==='electronics'&&(id==='lamp'||id==='fridge')).flatMap(id=>(Object.keys(HOME_TIERS) as HomeTier[]).map(tier=>{const item=HOME_ITEMS[id],old=owned.find(i=>i.id===id),oldTier=old?.tier??'basic',current=!!old&&oldTier===tier,better=!!old&&HOME_TIERS[oldTier].comfort>HOME_TIERS[tier].comfort,price=homePrice(id,tier)-(old?homePrice(id,oldTier):0),name=homeName(id,tier);return <article key={id+tier} data-product={id}>{(()=>{const sp=spriteFor(id,tier);return sp?<div className="product-glyph model-art"><img src={sp.f} alt="" loading="lazy"/></div>:<HomeArt id={id}/>})()}<h3>{name}</h3><span className="shop-facts">{id!=='painting'&&id!=='lamp'&&<span title="Kích thước"><Icon name="grid"/>{(item.w/2).toLocaleString("vi-VN")}×{(item.h/2).toLocaleString("vi-VN")} m</span>}{HOME_TIERS[tier].comfort>0&&<span title="Bớt căng thẳng mỗi đêm"><Icon name="moon"/>Căng thẳng −{HOME_TIERS[tier].comfort}/đêm</span>}</span><button type="button" aria-label={current?'Đang dùng '+name:(old?'Đổi sang ':'Mua ')+name} disabled={current||better||state.money<price} onClick={()=>run(onBuy(id,tier),old?'Đã đổi đồ mới.':'Đã thêm vào kho.')}>{current?'Đang dùng':better?'Đã có tốt hơn':money(price)}</button></article>}))}
 {(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===category).map(id=>{const item=PRODUCTS[id],has=l.owned.includes(id),active=l.outfit===id||l.transport===id;return <article key={id} data-product={id}><div className="product-glyph"><img src={productArt(id)} alt="" loading="lazy" decoding="async"/></div><h3>{item.name}</h3><span className="shop-facts" title={item.effect}><span><Icon name={FACT[id][0]}/>{FACT[id][1]}</span></span>{has&&item.category!=='electronics'?<button disabled={active} onClick={()=>run(onLife({kind:'equip',id,category:item.category as 'clothing'|'transport'}),'Đã chọn '+item.name.toLocaleLowerCase('vi')+'.')}>{active?'Đang dùng':item.category==='clothing'?'Mặc':'Sử dụng'}</button>:<button disabled>{has?'Đã có':'Ở TTTM'}</button>}</article>})}</div>
 {category==='transport'&&<button className="life-secondary" disabled={!l.transport} onClick={()=>run(onLife({kind:'equip',id:null,category:'transport'}),'Đã chọn đi bộ.')}>Đi bộ</button>}
 </section>
}
