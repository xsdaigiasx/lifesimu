/** T90 (chủ dự án duyệt 05/11): thời tiết nhẹ theo mùa, tính từ ngày game nên tải lại không đổi và không cần lưu.
 * Mưa làm đi lại chậm và tốn hơn, bão chặn đi bộ, xe đạp, đóng công viên; ngày mai được báo trước. */
import {dateAt} from './format';
import {hash} from './shift';
import type {PlaceId} from './types';

export type Weather='sunny'|'mild'|'rain'|'storm';
export const WEATHER_LABEL:Record<Weather,string>={sunny:'Nắng',mild:'Râm mát',rain:'Mưa',storm:'Bão'};
export const WEATHER_ICON:Record<Weather,string>={sunny:'sun',mild:'cloud',rain:'rain',storm:'storm'};
/** Mùa mưa tháng 6 đến 11 (game khởi đầu tháng 11). Xác suất theo phần trăm: [bão, mưa, râm mát], còn lại là nắng. */
export const RAINY_MONTHS=[6,7,8,9,10,11];
export const CHANCE={rainy:[5,35,20],dry:[0,8,27]} as const;
/** Hệ số đi lại theo thời tiết. `blocked` là phương tiện không đi được. */
export const TRAVEL={
 rain:{time:1.3,fare:1.2,walkEnergy:1.3,blocked:[] as string[]},
 storm:{time:2,fare:1.5,walkEnergy:1,blocked:['walk','bicycle']}} as const;
/** Mưa làm công viên kém hiệu quả: phần thưởng nhân hệ số này. Bão đóng cửa. */
export const PARK_RAIN=.6;
/** Nơi ngoài trời: bão thì không gặp NPC ngoài đường. */
export const OUTDOOR:PlaceId[]=['park','market','streetfood','bus','lake'];

export function weatherOf(day:number):Weather{
 const month=dateAt(day).getUTCMonth()+1,[storm,rain,mild]=RAINY_MONTHS.includes(month)?CHANCE.rainy:CHANCE.dry,r=hash(`weather:${day}`)%100;
 if(r<storm)return'storm';if(r<storm+rain)return'rain';if(r<storm+rain+mild)return'mild';return'sunny'}
export const forecastOf=(day:number)=>weatherOf(day+1);
export const parkClosed=(day:number)=>weatherOf(day)==='storm';
