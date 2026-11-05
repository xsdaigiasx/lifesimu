import type {Summary} from '../domain/summary';
import {titleOf,jobText,skillText} from '../domain/summary';
import {castById,relationTier} from '../domain/npc';
import {shortDate,money} from '../domain/format';

/** T35: vẽ bản tổng kết thành ảnh PNG (chỉ dùng dữ kiện trong bản). */
const W=1080,PAD=56,FONT='"life-sans", system-ui, sans-serif';
export async function summaryImage(m:Summary):Promise<Blob>{
 try{await document.fonts?.ready}catch{/* dùng phông mặc định */}
 const cards:[string,string][]=[[money(m.money),'Tiền mặt'],[skillText(m),'Kỹ năng cao nhất'],[jobText(m),'Công việc']];
 if(m.company){const c=m.company;cards.push([money(c.fund),'Quỹ công ty'],[`${c.rep}/100`,'Uy tín'],[String(c.staff),'Nhân viên'],[String(c.done),'Dự án xong'])}
 const people=m.people.map(p=>({n:castById(p.id),p})).filter(x=>x.n);
 const cw=(W-PAD*2-24)/2,ch=150,rows=1+Math.ceil((cards.length-1)/2);
 const H=240+rows*(ch+24)+(people.length?70+people.length*150:0)+(m.marks.length?70+m.marks.length*64:0)+90;
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d')!;
 g.fillStyle='#f5f7ec';g.fillRect(0,0,W,H);g.fillStyle='#38644e';g.fillRect(0,0,W,190);
 g.fillStyle='#fff';g.textBaseline='alphabetic';g.font=`700 64px ${FONT}`;g.fillText(titleOf(m),PAD,100);g.font=`400 32px ${FONT}`;g.fillStyle='#d6e5d0';g.fillText(`Một đời để sống, ${shortDate(m.day)}`,PAD,150);
 const box=(x:number,y:number,w:number,h:number)=>{g.fillStyle='#fffef4';g.strokeStyle='#dce5d2';g.lineWidth=2;g.beginPath();g.roundRect(x,y,w,h,20);g.fill();g.stroke()};
 const fit=(t:string,w:number,size:number,weight:number)=>{let s=size;g.font=`${weight} ${s}px ${FONT}`;while(g.measureText(t).width>w&&s>20){s-=2;g.font=`${weight} ${s}px ${FONT}`}};
 let y=230,col=0;
 cards.forEach(([v,l],i)=>{const wide=i===2;if(wide&&col===1){col=0;y+=ch+24}
  const w=wide?W-PAD*2:cw,xx=wide?PAD:PAD+col*(cw+24);
  box(xx,y,w,ch);fit(v,w-56,48,700);g.fillStyle='#17403a';g.fillText(v,xx+28,y+76);g.font=`400 28px ${FONT}`;g.fillStyle='#7f8c73';g.fillText(l,xx+28,y+120);
  if(wide||col===1){col=0;y+=ch+24}else col=1});
 if(col===1)y+=ch+24;
 y+=10;
 const head=(t:string)=>{g.font=`600 30px ${FONT}`;g.fillStyle='#7f8c73';g.fillText(t,PAD+4,y+20);y+=50};
 if(people.length){head('Người đồng hành');for(const{n,p}of people){box(PAD,y,W-PAD*2,130);g.fillStyle=n!.tone;g.beginPath();g.arc(PAD+70,y+65,38,0,Math.PI*2);g.fill();g.fillStyle='#344b3f';g.font=`700 28px ${FONT}`;g.textAlign='center';g.fillText(n!.label,PAD+70,y+76);g.textAlign='left';
  g.fillStyle='#17403a';fit(`${n!.name}, ${relationTier(p.score,n!.id)}`,W-PAD*2-190,38,700);g.fillText(`${n!.name}, ${relationTier(p.score,n!.id)}`,PAD+130,y+(p.memory?54:76));
  if(p.memory){g.fillStyle='#4b6b4f';fit(`“${p.memory}”`,W-PAD*2-190,30,400);g.fillText(`“${p.memory}”`,PAD+130,y+98)}y+=150}}
 if(m.marks.length){y+=10;head('Mốc nổi bật');for(const k of m.marks){g.font=`400 28px ${FONT}`;g.fillStyle='#7f8c73';g.fillText(shortDate(k.day),PAD+4,y+34);g.fillStyle='#17403a';fit(k.title,W-PAD*2-230,34,700);g.fillText(k.title,PAD+230,y+34);g.strokeStyle='#e3ead8';g.lineWidth=2;g.beginPath();g.moveTo(PAD,y+54);g.lineTo(W-PAD,y+54);g.stroke();y+=64}}
 return new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('canvas')),'image/png'));
}

/** Mở bảng chia sẻ của thiết bị nếu có, không thì tải ảnh về. Trả về cách đã làm. */
export async function shareSummary(m:Summary):Promise<'shared'|'saved'|'cancel'>{
 const blob=await summaryImage(m),file=new File([blob],`tong-ket-${m.id}.png`,{type:'image/png'});
 try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:titleOf(m)});return'shared'}}catch(e){if((e as Error).name==='AbortError')return'cancel'}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return'saved';
}
