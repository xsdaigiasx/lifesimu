const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
const manifests=['room','furniture'].flatMap(group=>JSON.parse(fs.readFileSync(path.join(root,group,'manifest.json'))).assets.map(a=>({...a,group})));
const get=(id,direction='a',variant)=>manifests.find(a=>a.id===id&&a.direction===direction&&(!variant||a.variant===variant));
const at=(x,y,z=0)=>[576+(x-y)*64,384+(x+y)*32-z*32];
const placements=[
 ['bed-basic','b','sage',0,6,0],
 ['desk-work','b','oak',1,4,0],
 ['chair-work','b','sage',0,4,0],
 ['rug-small','a','sage',3,4,0],
 ['table-dining','a','oak',6,4,0],
 ['stool','a','sage',7,6,0],
 ['lamp-desk','a','cream',1,5,2.9],
 ['plant-monstera','a','default',4,7,0],
 // Wall assets have a zero-depth plane: compensate their intrinsic top-right origin.
 ['window','a','default',0,4,4],
 ['door-main','closed','default',0,1,0],
 ['door-bath','closed','default',6,3,0],
];
function inner(a){return fs.readFileSync(path.join(root,a.group,a.source),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');}
async function main(){
 fs.mkdirSync(path.join(root,'previews'),{recursive:true});
 const shell=get('room-shell-tro');let parts=[inner(shell)];
 // Rug first, then painter order. Door/window positions are reference-only wall mounts.
 const ordered=[placements.find(p=>p[0]==='rug-small'),...placements.filter(p=>p[0]!=='rug-small').sort((a,b)=>(a[3]+a[4])-(b[3]+b[4]))];
 for(const [id,dir,variant,x,y,z] of ordered){const a=get(id,dir,variant),[px,py]=at(x+a.footprint_tiles[0],y+a.footprint_tiles[1],z);parts.push(`<g transform="translate(${px-a.anchor_px[0]} ${py-a.anchor_px[1]})">${inner(a)}</g>`);}
 const bg='#f6f0e4'; const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1152" height="960" viewBox="0 -40 1152 960"><rect x="0" y="-40" width="1152" height="960" fill="${bg}"/>${parts.join('')}</svg>`;
 fs.writeFileSync(path.join(root,'previews','room-furnished.svg'),svg);
 await sharp(Buffer.from(svg)).png({palette:true,colours:128,dither:0}).toFile(path.join(root,'previews','room-furnished.png'));
 await sharp(Buffer.from(svg)).resize(380).png().toFile(path.join(root,'previews','room-mobile-380.png'));
 // All states and colors, with literal file names, on a checkerboard for alpha inspection.
 const cellW=380,cellH=360,cols=4,rows=Math.ceil(manifests.length/cols);let tiles=[];
 for(let i=0;i<manifests.length;i++){const a=manifests[i],x=(i%cols)*cellW,y=Math.floor(i/cols)*cellH,scale=Math.min(330/a.frame_px[0],294/a.frame_px[1],1);tiles.push(`<g transform="translate(${x} ${y})"><rect width="${cellW}" height="${cellH}" fill="url(#checks)"/><g transform="translate(${(cellW-a.frame_px[0]*scale)/2} ${300-a.frame_px[1]*scale}) scale(${scale})">${inner(a)}</g><text x="12" y="326" font-family="sans-serif" font-size="12" fill="#173e38">${a.file}</text><text x="12" y="346" font-family="sans-serif" font-size="12" fill="#173e38">${a.frame_px.join('×')} · ${a.footprint_tiles.join('×')} tiles · ${a.height_z} z</text></g>`);}
 const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW*cols}" height="${cellH*rows}"><defs><pattern id="checks" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f6f0e4"/><path d="M0 0H12V12H0Z M12 12H24V24H12Z" fill="#e7e5dc"/></pattern></defs>${tiles.join('')}</svg>`;
 await sharp(Buffer.from(sheet)).png({palette:true,colours:128,dither:0}).toFile(path.join(root,'previews','contact-sheet.png'));
 fs.writeFileSync(path.join(root,'previews','placements.json'),JSON.stringify({origin_px:[576,384],tile_px:[128,64],placement_coordinates:'top/back footprint corner; integer x,y in tiles, z in 32px units; lamp sits on desk top at z=2.9',clearance_rects:[{id:'main-entry',x:0,y:1,w:2,h:2},{id:'bath-entry',x:6,y:3,w:1,h:1}],walk_start:[1,1],walk_targets:[[0,3],[2,4],[3,7],[5,4],[6,6],[6,3]],placements:placements.map(([id,direction,variant,x,y,z])=>({id,direction,variant,x,y,z,...(id==='lamp-desk'?{support_id:'desk-work'}:{})}))},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1});
