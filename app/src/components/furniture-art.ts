import SPRITES from '../domain/furniture-sprites.json';
import type {HomeId} from '../domain/home';
/** Nội thất Codex #89 lô 5: mỗi mẫu bốn hướng a, b, c, d (0°, 90°, 180°, 270°). */
export type Sprite={f:string;w:number;h:number;ax:number;ay:number;fw:number;fh:number};
const DIR:Record<number,string>={0:'a',90:'b',180:'c',270:'d'};
export const spriteFor=(id:HomeId,tier:string|undefined,rot=0):Sprite|undefined=>(SPRITES as Record<string,Sprite>)[`${id}-${tier??'basic'}_${DIR[rot]??'a'}`];
