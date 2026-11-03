import type {Tile} from './geometry';
export type TileStatus='queued'|'loading'|'ready'|'error';
export interface DecodedImage {naturalWidth:number;naturalHeight:number;onload:((event?:unknown)=>void)|null;onerror:((event?:unknown)=>void)|null;src:string;decoding?:string;fetchPriority?:string;decode:()=>Promise<void>}
interface RecordEntry {status:TileStatus;image?:DecodedImage;error?:Error;promise:Promise<void>;resolve:()=>void;reject:(error:Error)=>void;priority:number;tile:Tile}
export class TileLoader{
 private entries=new Map<string,RecordEntry>();private active=0;private listeners=new Set<()=>void>();
 constructor(private readonly makeImage:()=>DecodedImage=()=>new Image() as unknown as DecodedImage,private readonly concurrency=3,private readonly baseURL='./'){}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener)}}
 private emit(){for(const f of this.listeners)f()}
 status(id:string){return this.entries.get(id)?.status}
 image(id:string){const e=this.entries.get(id);return e?.status==='ready'?e.image:undefined}
 error(id:string){return this.entries.get(id)?.error}
 ready(tiles:readonly Tile[]){return tiles.length>0&&tiles.every(t=>this.status(t.id)==='ready')}
 ensure(tiles:readonly Tile[],priority=10):Promise<void>{const promises=tiles.map(tile=>{let e=this.entries.get(tile.id);if(e){e.priority=Math.max(e.priority,priority);return e.promise}let resolve!:()=>void,reject!:(e:Error)=>void;const promise=new Promise<void>((yes,no)=>{resolve=yes;reject=no});promise.catch(()=>{});e={tile,status:'queued',promise,resolve,reject,priority};this.entries.set(tile.id,e);return promise});this.pump();return Promise.all(promises).then(()=>{})}
 retry(tiles:readonly Tile[]){for(const tile of tiles)if(this.status(tile.id)==='error')this.entries.delete(tile.id);return this.ensure(tiles,100)}
 private pump(){let started=false;while(this.active<this.concurrency){const next=[...this.entries.values()].filter(e=>e.status==='queued').sort((a,b)=>b.priority-a.priority)[0];if(!next)break;this.active++;started=true;next.status='loading';this.load(next)}if(started)this.emit()}
 private load(e:RecordEntry){const image=this.makeImage();image.decoding='async';image.fetchPriority=e.priority>=100?'high':'low';let settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timeout);image.onload=null;image.onerror=null;if(error){e.status='error';e.error=error;e.reject(error)}else{e.status='ready';e.image=image;e.resolve()}this.active--;this.pump();this.emit()};const timeout=setTimeout(()=>finish(new Error('Tải ảnh quá lâu. Hãy thử lại.')),20000);
 image.onerror=()=>finish(new Error('Không tải được khu vực bản đồ.'));
 image.onload=()=>{image.decode().then(()=>{if(image.naturalWidth!==e.tile.width||image.naturalHeight!==e.tile.height)finish(new Error('Kích thước ô bản đồ không đúng.'));else finish()}).catch(()=>finish(new Error('Không giải mã được ảnh bản đồ.')))};
 image.src=this.baseURL+e.tile.url;
 }
}
