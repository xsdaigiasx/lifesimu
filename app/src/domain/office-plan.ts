/** Mặt bằng văn phòng isometric dựng từ khuôn (kế hoạch mục 18.3, chốt 04/11).
 * 1 ô sàn khoảng 0,5 m; ô 128×64 px; 1 đơn vị cao = 32 px (theo quy cách asset trong AGENTS.md).
 * Văn phòng = các khu ghép thành một sàn liền; mỗi khu đặt đồ theo khuôn của loại khu. */
import type {OfficeSize,Industry} from './office';

export const TILE_W=128,TILE_H=64,Z_PX=32;
export type ZoneKind='work'|'pantry'|'meeting'|'boss'|'reception';
export const ZONE_NAME:Record<ZoneKind,string>={work:'Khu làm việc',pantry:'Pantry',meeting:'Phòng họp',boss:'Phòng trưởng nhóm',reception:'Lễ tân'};

/** Bộ đồ: chân đế w×d ô, cao h đơn vị. set common dùng mọi ngành, tech là bộ ngành Công nghệ. */
export const KIT={
 'desk-pc':{name:'Bàn làm việc có máy tính',w:2,d:1,h:2,set:'tech',color:'#c9a97a'},
 chair:{name:'Ghế xoay',w:1,d:1,h:1,set:'common',color:'#7c9a7e'},
 shelf:{name:'Kệ tài liệu',w:2,d:1,h:3,set:'common',color:'#a98c66'},
 plant:{name:'Chậu cây',w:1,d:1,h:2,set:'common',color:'#6f9a5b'},
 counter:{name:'Quầy pantry',w:3,d:1,h:2,set:'common',color:'#b9b1a1'},
 'water-cooler':{name:'Cây nước',w:1,d:1,h:2,set:'common',color:'#9cc0cf'},
 'cafe-table':{name:'Bàn cà phê',w:1,d:1,h:1,set:'common',color:'#c9a97a'},
 'meeting-table':{name:'Bàn họp',w:3,d:2,h:1,set:'common',color:'#b08d64'},
 whiteboard:{name:'Bảng trắng',w:2,d:1,h:3,set:'tech',color:'#e8ece9'},
 sofa:{name:'Sofa',w:2,d:1,h:1,set:'common',color:'#8e9fb5'},
 'boss-desk':{name:'Bàn trưởng nhóm',w:3,d:1,h:2,set:'common',color:'#8f6d4c'},
 reception:{name:'Quầy lễ tân',w:3,d:1,h:2,set:'common',color:'#c2b49a'},
 'server-rack':{name:'Tủ máy chủ',w:1,d:1,h:4,set:'tech',color:'#5e6670'},
 printer:{name:'Máy in',w:1,d:1,h:1,set:'common',color:'#d8d6cf'},
} as const;
export type KitId=keyof typeof KIT;
/** Lô đầu giao Codex vẽ. */
export const FIRST_BATCH:KitId[]=['desk-pc','chair','shelf','plant'];

export interface Zone{id:string;kind:ZoneKind;name:string;x:number;y:number;w:number;d:number}
export interface Piece{key:string;item:KitId;x:number;y:number;zone:string}
export interface Seat{index:number;x:number;y:number;desk:string;zone:string}
export interface Door{x:number;y:number;axis:'x'|'y'}
export interface OfficePlan{w:number;d:number;zones:Zone[];pieces:Piece[];seats:Seat[];doors:Door[]}

type ZoneSpec={kind:ZoneKind;x:number;y:number;w:number;d:number;label?:string};
/** Khuôn theo cỡ. Diện tích: Nhỏ 13×12 ≈ 40 m², Vừa 16×12 + 12×12 ≈ 85 m², Lớn 16×12 ×2 + 8×12 ×2 + 16×8 ≈ 160 m². */
const SHELLS:Record<OfficeSize,ZoneSpec[]>={
 small:[{kind:'work',x:0,y:0,w:13,d:12}],
 medium:[{kind:'work',x:0,y:0,w:16,d:12},{kind:'meeting',x:16,y:0,w:12,d:12}],
 large:[{kind:'reception',x:0,y:0,w:16,d:8},{kind:'work',x:0,y:8,w:16,d:12,label:'Khu làm việc A'},{kind:'work',x:16,y:8,w:16,d:12,label:'Khu làm việc B'},{kind:'meeting',x:16,y:0,w:8,d:8},{kind:'boss',x:24,y:0,w:8,d:8}],
};

/** Đặt đồ trong một khu theo loại khu. Toạ độ tương đối với góc khu. */
function furnish(z:ZoneSpec,industry:Industry,seatsWanted:number,withPantry:boolean){const p:{item:KitId;x:number;y:number}[]=[],seats:{x:number;y:number;desk:number}[]=[];const add=(item:KitId,x:number,y:number)=>{p.push({item,x,y});return p.length-1};
 if(z.kind==='work'){add('shelf',1,0);add('plant',0,0);add('plant',z.w-1,0);if(industry==='tech')add('whiteboard',4,0);if(industry==='tech'&&z.w>=13)add('server-rack',z.w-2,0);add('printer',z.w-3,0);
  const cols=Math.floor((z.w-2)/3);let n=0;for(let row=2;row+2<=z.d-1&&n<seatsWanted;row+=3)for(let c=0;c<cols&&n<seatsWanted;c++){const x=1+c*3,desk=add('desk-pc',x,row);add('chair',x,row+1);seats.push({x,y:row+1,desk});n++}
  if(withPantry){add('counter',z.w-4,z.d-1);add('water-cooler',z.w-1,z.d-1);add('cafe-table',z.w-3,z.d-3)}}
 else if(z.kind==='meeting'){const tx=Math.floor((z.w-3)/2),ty=Math.floor((z.d-2)/2);add('meeting-table',tx,ty);for(let i=0;i<3;i++){add('chair',tx+i,ty-1);add('chair',tx+i,ty+2)}add('whiteboard',tx,0);add('plant',z.w-1,0);if(withPantry){add('counter',0,z.d-1);add('water-cooler',3,z.d-1);add('cafe-table',z.w-2,z.d-2);add('chair',z.w-3,z.d-2)}}
 else if(z.kind==='boss'){add('boss-desk',2,2);add('chair',3,3);add('shelf',1,0);add('sofa',2,z.d-2);add('plant',z.w-1,0)}
 else if(z.kind==='reception'){add('reception',2,3);add('chair',3,2);add('sofa',8,z.d-2);add('plant',0,0);add('plant',z.w-1,z.d-1);add('counter',11,0);add('water-cooler',14,0);add('cafe-table',12,3)}
 else{add('counter',0,0);add('water-cooler',3,0);add('cafe-table',2,3);add('plant',z.w-1,0)}
 return{pieces:p,seats}}

/** Dựng mặt bằng: cùng cỡ và ngành luôn cho cùng kết quả. */
export function buildPlan(size:OfficeSize,industry:Industry,seats:number):OfficePlan{const specs=SHELLS[size];const zones:Zone[]=[],pieces:Piece[]=[],out:Seat[]=[];const works=specs.filter(z=>z.kind==='work').length;let left=seats;
 specs.forEach((z,i)=>{const id=`${z.kind}-${i}`;zones.push({id,kind:z.kind,name:z.label??ZONE_NAME[z.kind],x:z.x,y:z.y,w:z.w,d:z.d});
  const want=z.kind==='work'?Math.ceil(left/Math.max(1,works-specs.slice(0,i).filter(s=>s.kind==='work').length)):0;const f=furnish(z,industry,want,size==='small'?z.kind==='work':z.kind==='meeting');left-=f.seats.length;
  f.pieces.forEach((q,j)=>pieces.push({key:`${id}:${j}`,item:q.item,x:z.x+q.x,y:z.y+q.y,zone:id}));
  f.seats.forEach(s=>out.push({index:out.length,x:z.x+s.x,y:z.y+s.y,desk:`${id}:${s.desk}`,zone:id}))});
 const w=Math.max(...zones.map(z=>z.x+z.w)),d=Math.max(...zones.map(z=>z.y+z.d));
 const doors:Door[]=[];for(const a of zones)for(const b of zones){if(a.x+a.w===b.x&&a.y<b.y+b.d&&b.y<a.y+a.d){const y0=Math.max(a.y,b.y),y1=Math.min(a.y+a.d,b.y+b.d);doors.push({x:b.x,y:Math.floor((y0+y1)/2)-1,axis:'y'})}if(a.y+a.d===b.y&&a.x<b.x+b.w&&b.x<a.x+a.w){const x0=Math.max(a.x,b.x),x1=Math.min(a.x+a.w,b.x+b.w);doors.push({x:Math.floor((x0+x1)/2)-1,y:b.y,axis:'x'})}}
 return{w,d,zones,pieces,seats:out,doors}}

/** Toạ độ màn hình (px, chưa phóng) của một điểm trên sàn. */
export const iso=(x:number,y:number)=>({x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2});
/** Khung ảnh asset: rộng (w+d)×64, cao (w+d)×32 + h×32; mép trái thẳng góc trái chân đế, mép dưới ở đỉnh dưới. */
export function spriteBox(p:{x:number;y:number},item:KitId){const k=KIT[item],width=(k.w+k.d)*TILE_W/2,height=(k.w+k.d)*TILE_H/2+k.h*Z_PX,left=iso(p.x,p.y+k.d).x,bottom=iso(p.x+k.w,p.y+k.d).y;return{left,top:bottom-height,width,height}}
/** Thứ tự vẽ: món ở sau (x+y nhỏ) vẽ trước. */
export const depth=(p:{x:number;y:number;item:KitId})=>p.x+p.y+(KIT[p.item].w+KIT[p.item].d)/2;
