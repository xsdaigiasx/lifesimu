import {alignHomeAxes} from './home-geometry';
import type {HomeId} from './home';
interface HomeArtVariant {src:string;scale:number;anchorX:number;anchorY:number}
export const HOME_ART:Record<HomeId,[HomeArtVariant,HomeArtVariant]> = {
  "tv": [{"src":"/assets/furniture/tv-basic_a.webp","scale":1,"anchorX":50,"anchorY":100},{"src":"/assets/furniture/tv-basic_b.webp","scale":1,"anchorX":50,"anchorY":100}],
  "fridge": [{"src":"/assets/furniture/fridge-basic_a.webp","scale":1,"anchorX":50,"anchorY":100},{"src":"/assets/furniture/fridge-basic_b.webp","scale":1,"anchorX":50,"anchorY":100}],
  "bed": [
    {
      "src":"/assets/furniture/bed-basic_a.webp",
      "scale": 1.07277,
      "anchorX": 38.2353,
      "anchorY": 94.7456
    },
    {
      "src":"/assets/furniture/bed-basic_b.webp",
      "scale": 1.19056,
      "anchorX": 60.0587,
      "anchorY": 94.6622
    }
  ],
  "wardrobe": [
    {
      "src":"/assets/furniture/wardrobe-basic_a.webp",
      "scale": 2.1473,
      "anchorX": 58.6729,
      "anchorY": 95.7465
    },
    {
      "src":"/assets/furniture/wardrobe-basic_b.webp",
      "scale": 1.76532,
      "anchorX": 39.7087,
      "anchorY": 96.544
    }
  ],
  "desk": [
    {
      "src":"/assets/furniture/desk-basic_a.webp",
      "scale": 1.59223,
      "anchorX": 57.356,
      "anchorY": 86.0717
    },
    {
      "src":"/assets/furniture/desk-basic_b.webp",
      "scale": 1.6264,
      "anchorX": 46.2735,
      "anchorY": 85.0622
    }
  ],
  "table": [
    {
      "src":"/assets/furniture/table-basic_a.webp",
      "scale": 1.40471,
      "anchorX": 50.7519,
      "anchorY": 92.1601
    },
    {
      "src":"/assets/furniture/table-basic_b.webp",
      "scale": 1.46429,
      "anchorX": 46.8959,
      "anchorY": 88.824
    }
  ],
  "plant": [
    {
      "src":"/assets/furniture/plant-basic_a.webp",
      "scale": 1.32143,
      "anchorX": 49.9176,
      "anchorY": 96.2963
    },
    {
      "src":"/assets/furniture/plant-basic_b.webp",
      "scale": 1.29242,
      "anchorX": 49.7755,
      "anchorY": 96.1317
    }
  ],
  "lamp": [{"anchorY":89.8108,"scale":1.51055,"anchorX":50,"src":"/assets/furniture/lamp-basic_a.webp"},{"anchorY":89.8108,"scale":1.51055,"anchorX":50,"src":"/assets/furniture/lamp-basic_b.webp"}],
  "painting": [{src:"/assets/furniture/painting-basic_a.webp",scale:1,anchorX:50,anchorY:100},{src:"/assets/furniture/painting-basic_b.webp",scale:1,anchorX:50,anchorY:100}],
  "rug": [
    {
      "src":"/assets/furniture/rug-basic_a.webp",
      "scale": 1.05931,
      "anchorX": 66.4597,
      "anchorY": 92.4805
    },
    {
      "src":"/assets/furniture/rug-basic_b.webp",
      "scale": 1.10029,
      "anchorX": 65.1174,
      "anchorY": 98.3398
    }
  ]
};


// Slopes measured from straight top edges in the source PNGs (right, left).
export const HOME_SOURCE_AXES:Partial<Record<HomeId,[[number,number],[number,number]]>>={
 bed:[[0.609,0.65],[0.709,0.567]],
 wardrobe:[[0.609,0.595],[0.704,0.592]],
 desk:[[0.585,0.658],[0.716,0.59]],
 table:[[0.658,0.675],[0.852,0.598]]
};
export function homeArtProjection(id:HomeId,rotation:number){const slopes=HOME_SOURCE_AXES[id]?.[rotation?1:0];return slopes?alignHomeAxes(...slopes):{shearY:0,scaleY:1}}

// Center of the support plane, measured from the feet/base (percent of source PNG).
// This is deliberately separate from alpha bounds and the lowest single foot.
export const HOME_GROUND:Record<HomeId,[{x:number;y:number;scale:number},{x:number;y:number;scale:number}]>={
 bed:[{x:51,y:64,scale:1/.88},{x:51,y:64,scale:1/.80}],
 wardrobe:[{x:52,y:81.5,scale:1/.44},{x:52,y:82,scale:1/.52}],
 desk:[{x:53,y:66.5,scale:1/.60},{x:50.5,y:68,scale:1/.57}],
 table:[{x:50,y:67.5,scale:1/.60},{x:52,y:65.5,scale:1/.62}],
 plant:[{x:50,y:92,scale:HOME_ART.plant[0].scale},{x:50,y:92,scale:HOME_ART.plant[1].scale}],
 lamp:[{x:50,y:85.8108,scale:HOME_ART.lamp[0].scale*.5},{x:50,y:85.8108,scale:HOME_ART.lamp[1].scale*.5}],
 painting:[{x:50,y:100,scale:1},{x:50,y:100,scale:1}],
 rug:[{x:50,y:50,scale:1},{x:50,y:50,scale:1}],
 fridge:[{x:50,y:85,scale:1},{x:50,y:85,scale:1}],
 tv:[{x:50,y:90,scale:1},{x:50,y:90,scale:1}]
};
