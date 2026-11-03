import plan from './city-plan.json';
export interface CityRoad {id:string;width:number;segments:number[][][]}
export const cityRoads:CityRoad[]=plan.roads;
export function curvePoint(segment:number[][],t:number){const [a,b,c,d]=segment,q=1-t;return{x:q**3*a[0]+3*q*q*t*b[0]+3*q*t*t*c[0]+t**3*d[0],y:q**3*a[1]+3*q*q*t*b[1]+3*q*t*t*c[1]+t**3*d[1]}}
export function roadPath(road:CityRoad){return road.segments.map(segment=>`M${segment[0].join(' ')}C${segment.slice(1).map(p=>p.join(' ')).join(' ')}`).join(' ')}
export function sampledRoads(){return cityRoads.map(road=>({width:road.width,points:road.segments.flatMap(segment=>Array.from({length:81},(_,i)=>curvePoint(segment,i/80)))}))}
