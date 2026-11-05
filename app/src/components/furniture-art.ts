import SPRITES from '../domain/furniture-sprites.json';
import CATALOG from '../domain/catalog-art.json';
import type {HomeId} from '../domain/home';
/** Nội thất Codex #89 lô 5: mỗi mẫu bốn hướng a, b, c, d (0°, 90°, 180°, 270°). */
export type Sprite={f:string;w:number;h:number;ax:number;ay:number};
const DIR:Record<number,string>={0:'a',90:'b',180:'c',270:'d'};
export const spriteFor=(id:HomeId,tier:string|undefined,rot=0):Sprite|undefined=>(SPRITES as Record<string,Sprite>)[`${id}-${tier??'basic'}_${DIR[rot]??'a'}`];
/** Ảnh danh mục riêng cho thẻ trong danh sách mua sắm (không phải sprite đặt trong phòng). Khoá `<id>-<hạng>` ghi ở domain/catalog-art.json. */
export const catalogFor=(id:HomeId,tier?:string):string|undefined=>{const k=`${id}-${tier??'basic'}`;return (CATALOG as string[]).includes(k)?`/assets/catalog/${k}.webp`:undefined};
