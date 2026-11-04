const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'layouts.json'))),root=path.resolve(__dirname,'../..');
const ink='#4a3b33',round=n=>Math.round(n*1000)/1000;
const textures=Object.fromEntries(['wood','stone','bath','grass'].map(id=>[id,fs.readFileSync(path.join(__dirname,'materials',id+'.png')).toString('base64')]));
function geometry(f){const margin=cfg.margin_px,origin=[margin+f.h*64,margin+cfg.outer_wall_height_px];return {origin,width:margin*2+(f.w+f.h)*64,height:origin[1]+(f.w+f.h)*32+cfg.floor_thickness_px+margin,P:(x,y,z=0)=>[origin[0]+(x-y)*64,origin[1]+(x+y)*32-z]}}
function owner(f,x,y){const r=f.rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);if(r)return r.id;const s=f.stairs;if(x>=s.x&&x<s.x+s.w&&y>=s.y&&y<s.y+s.h)return 'stairs';return 'hall'}
const key=(axis,at,t)=>`${axis}:${at}:${t}`;
function structure(f){const walls=new Map(),roomIds=new Set(f.rooms.filter(r=>r.id!=='garden').map(r=>r.id));
 const add=(axis,at,t,a,b)=>{if(a!==b&&(roomIds.has(a)||roomIds.has(b)))walls.set(key(axis,at,t),{axis,at,from:t,to:t+1,between:[a,b]})};
 for(let x=1;x<f.w;x++)for(let y=0;y<f.h;y++)add('x',x,y,owner(f,x-1,y),owner(f,x,y));
 for(let y=1;y<f.h;y++)for(let x=0;x<f.w;x++)add('y',y,x,owner(f,x,y-1),owner(f,x,y));
 const doors=f.doors.map(d=>{if(d.to-d.from!==2)throw Error('Door width: '+f.id);for(let t=d.from;t<d.to;t++){const k=key(d.axis,d.at,t),wall=walls.get(k);if(!wall||wall.between.slice().sort().join('|')!==d.connects.slice().sort().join('|'))throw Error('Door not on declared boundary: '+f.id+' '+JSON.stringify(d));walls.delete(k)}return {...d,width_tiles:2}});
 const units=[...walls.values()],runs=[];for(const axis of ['x','y']){const ats=[...new Set(units.filter(s=>s.axis===axis).map(s=>s.at))];for(const at of ats){const u=units.filter(s=>s.axis===axis&&s.at===at).sort((a,b)=>a.from-b.from);for(const s of u){const last=runs.at(-1);if(last&&last.axis===axis&&last.at===at&&last.to===s.from)last.to=s.to;else runs.push({axis,at,from:s.from,to:s.to})}}}
 return {walls,units,runs,doors};
}
function validate(f,st){for(const r of f.rooms){const size=cfg.source_reference.room_sizes[f.house][r.id];if(!size||size[0]!==r.w||size[1]!==r.h)throw Error('Room size differs from HOUSES snapshot: '+f.id+' '+r.id)}const taken=new Map();for(const r of [...f.rooms,{id:'stairs',...f.stairs}]){if(![r.x,r.y,r.w,r.h].every(Number.isInteger)||r.x<0||r.y<0||r.x+r.w>f.w||r.y+r.h>f.h)throw Error('Bounds: '+f.id+' '+r.id);for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const k=x+','+y;if(taken.has(k))throw Error('Overlap: '+f.id+' '+k);taken.set(k,r.id)}}
 const start=[0,f.h-1],seen=new Set([start.join(',')]),q=[start];for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){if(nx<0||ny<0||nx>=f.w||ny>=f.h)continue;const k=nx+','+ny;if(seen.has(k))continue;const edge=nx!==x?key('x',Math.max(x,nx),y):key('y',Math.max(y,ny),x);if(st.walls.has(edge))continue;seen.add(k);q.push([nx,ny])}}
 if(seen.size!==f.w*f.h)throw Error('Disconnected cells: '+f.id+' '+seen.size+'/'+f.w*f.h);
 return {no_overlaps:true,in_bounds:true,all_cells_reachable:true,reachable_cells:seen.size,total_cells:f.w*f.h,hall_cells:f.w*f.h-taken.size,doors_width_2:true,door_count:st.doors.length};
}
function svg(f,debug=false){const g=geometry(f),P=g.P,pts=a=>a.map(p=>P(...p).map(round).join(',')).join(' '),poly=(a,fill,stroke=ink,sw=1.1,extra='')=>`<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
 const st=structure(f);let s=`<svg width="${g.width}" height="${g.height}" xmlns="http://www.w3.org/2000/svg"><defs>`;
 for(const [id,b64] of Object.entries(textures))s+=`<pattern id="tex-${id}" width="4" height="4" patternUnits="userSpaceOnUse"><image href="data:image/png;base64,${b64}" width="4" height="4" preserveAspectRatio="none"/></pattern>`;
 s+='</defs>';
 // The two exposed front edges are slab faces, not outer walls.
 s+=poly([[f.w,0,0],[f.w,f.h,0],[f.w,f.h,-16],[f.w,0,-16]],'#d9c4a7');s+=poly([[0,f.h,0],[f.w,f.h,0],[f.w,f.h,-16],[0,f.h,-16]],'#cdb79b');
 s+=`<g transform="matrix(64 32 -64 32 ${g.origin[0]} ${g.origin[1]})"><rect width="${f.w}" height="${f.h}" fill="#e8e1d2"/><rect width="${f.w}" height="${f.h}" fill="url(#tex-stone)" opacity="0.18"/>`;
 for(const r of f.rooms)s+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#tex-${r.material})" opacity="0.22"/>`;
 for(const p of f.garden_paths??[])s+=`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#e9e1c9"/><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#tex-stone)" opacity="0.25"/>`;
 s+='</g>';
 // Exact 1x1 world grid; all strokes live in screen coordinates.
 for(let x=0;x<=f.w;x++)s+=`<polyline points="${pts([[x,0],[x,f.h]])}" fill="none" stroke="#786c58" stroke-opacity="0.3" stroke-width="0.85"/>`;
 for(let y=0;y<=f.h;y++)s+=`<polyline points="${pts([[0,y],[f.w,y]])}" fill="none" stroke="#786c58" stroke-opacity="0.3" stroke-width="0.85"/>`;
 const prism=(x,y,w,h,z,top='#f6ecd9',right='#dfcfb7',front='#e7d9c2')=>poly([[x+w,y,0],[x+w,y+h,0],[x+w,y+h,z],[x+w,y,z]],right)+poly([[x,y+h,0],[x+w,y+h,0],[x+w,y+h,z],[x,y+h,z]],front)+poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],top);
 // Only x=0 and y=0 have full-height outer walls, built outwards.
 s+=prism(-.16,0,.16,f.h,128,'#f6e7cf','#e9d8bd','#d8c5aa');s+=prism(0,-.16,f.w,.16,128,'#fcf2df','#d9c7ac','#f1e4cf');
 const objects=st.runs.map(r=>({depth:(r.axis==='x'?r.at+(r.from+r.to)/2:r.at+(r.from+r.to)/2),draw:()=>r.axis==='x'?prism(r.at-.04,r.from,.08,r.to-r.from,32):prism(r.from,r.at-.04,r.to-r.from,.08,32)}));
 const a=f.stairs;if(f.floor===1){for(let i=0;i<8;i++){const x=a.x+(a.axis==='x'?i*a.w/8:0),y=a.y+(a.axis==='y'?i*a.h/8:0),w=a.axis==='x'?a.w/8:a.w,h=a.axis==='y'?a.h/8:a.h;objects.push({depth:x+y+(w+h)/2,draw:()=>prism(x,y,w,h,(i+1)*12,'#e6d2aa','#c9b895','#d9c7a7')})}}else{objects.push({depth:a.x+a.y+(a.w+a.h)/2,draw:()=>{const outline=[[a.x,a.y],[a.x+a.w,a.y],[a.x+a.w,a.y+a.h],[a.x,a.y+a.h]];let out='<defs><clipPath id="stair-hole"><polygon points="'+pts(outline)+'"/></clipPath></defs>'+poly(outline,'#b4a58c');out+='<g clip-path="url(#stair-hole)">';for(let i=0;i<8;i++){const x=a.x+(a.axis==='x'?i*a.w/8:0),y=a.y+(a.axis==='y'?i*a.h/8:0),w=a.axis==='x'?a.w/8:a.w,h=a.axis==='y'?a.h/8:a.h;out+=prism(x,y,w,h,-(i+1)*12,'#d8c49e','#ae9d7f','#c2af8f')}return out+'</g>'+poly(outline,'none',ink,1.3)}})}
 for(const [x,y] of f.shrubs??[])objects.push({depth:x+y,draw:()=>{const [cx,cy]=P(x,y);return `<g stroke="${ink}" stroke-width="1.1"><ellipse cx="${cx}" cy="${cy-8}" rx="48" ry="18" fill="#8da976"/><ellipse cx="${cx-22}" cy="${cy-25}" rx="28" ry="20" fill="#a4bf88"/><ellipse cx="${cx+18}" cy="${cy-30}" rx="31" ry="22" fill="#b2ca96"/><path d="M${cx-20},${cy-14}q8,-8 14,-1 M${cx+3},${cy-23}q7,-6 13,1" fill="none" stroke="#738866" stroke-width="1.3"/></g>`}});
 objects.sort((a,b)=>a.depth-b.depth);for(const o of objects)s+=o.draw();
 if(debug){for(const r of f.rooms){const [x,y]=P(r.x+r.w/2,r.y+r.h/2);s+=`<text x="${x}" y="${y}" text-anchor="middle" fill="#173e38" stroke="#fffaf0" stroke-width="5" paint-order="stroke" font-family="DejaVu Sans" font-size="56">${r.name} ${r.w}×${r.h}</text>`}for(const d of st.doors){const a=d.axis==='x'?[d.at,d.from]:[d.from,d.at],b=d.axis==='x'?[d.at,d.to]:[d.to,d.at];s+=`<polyline points="${pts([a,b])}" stroke="#df775a" stroke-width="7"/>`}}
 return s+'</svg>';
}
async function main(){const items=[],reports=[];fs.mkdirSync(path.join(root,'app/public/assets/houses'),{recursive:true});
 for(const f of cfg.floors){const st=structure(f),report=validate(f,st),g=geometry(f),buffer=await sharp(Buffer.from(svg(f))).png().toBuffer();let result=await sharp(buffer).webp({lossless:true,effort:6}).toBuffer(),compression='lossless';for(const quality of [95,90,85,80,75,70]){if(result.length<400000)break;result=await sharp(buffer).webp({quality,alphaQuality:100,effort:6}).toBuffer();compression='quality-'+quality}if(result.length>=400000)throw Error('Too large '+f.id);
 const target='app/public/assets/houses/'+f.id+'.webp';fs.writeFileSync(path.join(root,target),result);const meta=await sharp(result).metadata();if(meta.width!==g.width||meta.height!==g.height||!meta.hasAlpha)throw Error('Bad output '+f.id);
 const {data,info}=await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minx=info.width,miny=info.height,maxx=0,maxy=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y)}if(Math.min(minx,miny,info.width-maxx-1,info.height-maxy-1)<16)throw Error('Clipped output '+f.id);
 const corners=[[0,0],[f.w,0],[f.w,f.h],[0,f.h]].map(([x,y])=>({world:[x,y],pixel:g.P(x,y)}));
 items.push({id:f.id,house:f.house,floor:f.floor,name:f.name,file:'/assets/houses/'+f.id+'.webp',frame_px:[g.width,g.height],floor_tiles:[f.w,f.h],tile_px:[128,64],origin_px:g.origin,axis_x_px:[64,32],axis_y_px:[-64,32],floor_corners:corners,anchor_px:g.P(f.w,f.h),outer_walls:['x=0','y=0'],outer_wall_height_px:128,partition_height_px:32,partition_width_tiles:.08,rooms:f.rooms,stairs:{...f.stairs,steps:8,direction:f.floor===1?'up':'down',rise_px:f.floor===1?96:-96},doors:st.doors,partition_runs:st.runs,bytes:result.length,compression,rgba:true,alpha_bbox_px:[minx,miny,maxx+1,maxy+1],sha256:crypto.createHash('sha256').update(result).digest('hex')});reports.push({id:f.id,...report,exact_projection_2_to_1:true,alpha_margin_px:Math.min(minx,miny,info.width-maxx-1,info.height-maxy-1),bytes:result.length});console.log(f.id,g.width+'x'+g.height,result.length,compression,'cells reachable='+report.reachable_cells);
 }
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:89,lot:4,geometry:'x=originX+64*(x-y); y=originY+32*(x+y)-z',source_reference:cfg.source_reference,coordinate_source:cfg.coordinate_source,source:'Exact layout geometry; AI-generated material textures only',items},null,2)+'\n');fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify({issue:89,lot:4,checks:reports},null,2)+'\n');
}
module.exports={cfg,root,geometry,structure,validate,svg};if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
