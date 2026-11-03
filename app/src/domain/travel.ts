/** T08: phương tiện, thời gian đi và chi phí (workflow mục 15.2). Số liệu là đề xuất, chỉnh ở đây. */
export type TravelMode='walk'|'bicycle'|'bus'|'motorbike'|'taxi';
export interface ModeSpec{label:string;kmh:number;rush:number;wait:number;fareBase:number;farePerKm:number;parkFee:number;needs?:'bicycle'|'motorbike'}
export const MODES:Record<TravelMode,ModeSpec>={
 walk:{label:'Đi bộ',kmh:5,rush:1,wait:0,fareBase:0,farePerKm:0,parkFee:0},
 bicycle:{label:'Xe đạp',kmh:12,rush:1,wait:0,fareBase:0,farePerKm:0,parkFee:0,needs:'bicycle'},
 bus:{label:'Xe buýt',kmh:20,rush:.8,wait:10,fareBase:7000,farePerKm:0,parkFee:0},
 motorbike:{label:'Xe máy',kmh:28,rush:.7,wait:0,fareBase:0,farePerKm:1500,parkFee:5000,needs:'motorbike'},
 taxi:{label:'Taxi',kmh:25,rush:.8,wait:3,fareBase:0,farePerKm:15000,parkFee:0}};
export const MODE_ORDER:TravelMode[]=['walk','bicycle','bus','motorbike','taxi'];
/** Giờ cao điểm 7–9h và 17–19h; không ảnh hưởng đi bộ và xe đạp (rush = 1). */
export const isRush=(minuteOfDay:number)=>{const m=minuteOfDay%1440;return(m>=420&&m<540)||(m>=1020&&m<1140)};
export interface Quote{mode:TravelMode;meters:number;minutes:number;fare:number}
/** `meters` là quãng đường trên bản đồ; thời gian = km / tốc độ × 60 × hệ số cao điểm + chờ. */
export function quoteTrip(mode:TravelMode,meters:number,departMinute:number,toHome=false):Quote{if(meters<=0)return{mode,meters:0,minutes:0,fare:0};const m=MODES[mode],km=meters/1000,speed=m.kmh*(isRush(departMinute)?m.rush:1);const minutes=Math.max(1,Math.ceil(km/speed*60)+m.wait);const fare=Math.ceil(m.fareBase+m.farePerKm*km+(toHome?0:m.parkFee));return{mode,meters,minutes,fare}}
