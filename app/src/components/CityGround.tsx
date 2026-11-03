import {cityRoads,roadPath} from '../map/city-roads';
export default function CityGround(){return <svg className="city-ground" viewBox="0 0 1440 960" aria-hidden="true"><defs>
 <linearGradient id="city-grass" x2=".9" y2="1"><stop stopColor="#d2dec1"/><stop offset="1" stopColor="#b4cba5"/></linearGradient>
 <linearGradient id="city-water" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#88bdb7"/><stop offset="1" stopColor="#6ba6a3"/></linearGradient>
 <pattern id="water-waves" width="62" height="27" patternUnits="userSpaceOnUse"><path d="M4 14q12-5 24 0m12-7q9-4 18 0" fill="none" stroke="#d5e7d6" strokeWidth="1" opacity=".35"/></pattern>
 <pattern id="grass-grain" width="37" height="29" patternUnits="userSpaceOnUse"><path d="m4 10 3-2m18 17 2-3m5-13 3-1" stroke="#91ad7f" strokeWidth=".7" opacity=".24"/></pattern>
 </defs><rect width="1440" height="960" fill="url(#city-grass)"/><rect width="1440" height="960" fill="url(#grass-grain)"/>
 <path d="M1430-100C1300 180 1480 350 1405 600S1250 855 1130 1040H1600V-100Z" fill="#e2ddbe"/>
 <path d="M1460-100C1330 180 1510 350 1435 600S1280 855 1160 1040H1600V-100Z" fill="url(#city-water)"/>
 <path d="M1460-100C1330 180 1510 350 1435 600S1280 855 1160 1040H1600V-100Z" fill="url(#water-waves)"/>
 <path d="M1440-100C1310 180 1490 350 1415 600S1260 855 1140 1040" fill="none" stroke="#f1e9cf" strokeWidth="13"/>
 <path d="M200 420c220-180 410-220 780-180s400 200 320 500S770 1010 430 920 110 690 200 420Z" fill="#d6d6b8" opacity=".5"/>
 <path d="M280 420q160-95 330-20l180 190q-150 110-370 80z" fill="#dfd4b6" opacity=".35"/>
 <path d="M590 330q200-110 400 10l-90 140-245-18z" fill="#c3d0aa" opacity=".48"/>
 <g>{cityRoads.map(road=><path key={road.id} d={roadPath(road)} fill="none" stroke="#e9e3cc" strokeWidth={road.width+8}/>)}</g>
 <g>{cityRoads.map(road=><path key={road.id} d={roadPath(road)} fill="none" stroke={road.width>20?'#b1b7a8':'#bcc0ad'} strokeWidth={road.width}/>)}</g>
 <g>{cityRoads.filter(road=>road.width>=20).map(road=><path key={road.id} d={roadPath(road)} fill="none" stroke="#f5f0d8" strokeWidth="1" strokeDasharray="8 13"/>)}</g>
 <path d="M1240 810q50 45 15 110m-145-10q-40 5-60-22" fill="none" stroke="#e5dfbf" strokeWidth="5"/>
 <g fill="#e6e7cf" opacity=".9"><path d="m1330 510 24 12-24 12-24-12z"/><path d="m1290 600 20 10-20 10-20-10z"/></g>
 </svg>}
