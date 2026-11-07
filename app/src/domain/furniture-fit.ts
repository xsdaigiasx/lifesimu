/** Source virtual footprint anchor -> centered, inset art. Never stretch the camera. */
export function furnitureFit(sp:{w:number;h:number;ax:number;ay:number;fw:number;fh:number},w:number,h:number,inset=.9){
 const scale=Math.min(w/sp.fw,h/sp.fh)*inset;
 return {scale,cx:sp.ax-(sp.fw-sp.fh)*32,cy:sp.ay-(sp.fw+sp.fh)*16};
}
