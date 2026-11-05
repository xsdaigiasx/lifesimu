const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const models = {
  basic: {width: 1.19, depth: .39, height: 60, base: 5, screenBottom: 20},
  comfort: {width: 1.64, depth: .64, height: 79, base: 25, screenBottom: 29},
  premium: {width: 1.96, depth: .83, height: 96, base: 29, screenBottom: 35},
};

function drawGuide(model, direction) {
  const {width, depth, height, base, screenBottom} = model;
  const turned = direction === 'b' || direction === 'd';
  const H = 96 + height;
  function point(u, v, z) {
    const [x, y] = {
      a: [u + 1, v + .5], b: [.5 + v, 1 - u],
      c: [1 - u, .5 - v], d: [.5 - v, 1 + u],
    }[direction];
    return [64 * ((turned ? 2 : 1) + x - y), height + 32 * (x + y) - z];
  }
  function cuboid(u, v, bot, top, palette) {
    const p = [point(-u,-v,bot), point(u,-v,bot), point(u,v,bot), point(-u,v,bot)];
    const q = [point(-u,-v,top), point(u,-v,top), point(u,v,top), point(-u,v,top)];
    const front = direction === 'a' || direction === 'b';
    const long = front ? [2,3] : [0,1];
    const side = direction === 'a' || direction === 'd' ? [1,2] : [3,0];
    const face = (pts, fill) => '<polygon points="' + pts.map(x => x.join(',')).join(' ') + '" fill="' + fill + '" stroke="#4b514b" stroke-width=".5"/>';
    return face([p[long[0]],p[long[1]],q[long[1]],q[long[0]]], front ? palette[0] : palette[1]) +
      face([p[side[0]],p[side[1]],q[side[1]],q[side[0]]], palette[2]) + face(q, palette[3]);
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="'+H+'">' +
    cuboid(width/2,depth/2,0,base,['#949a86','#818776','#77806b','#b89b72']) +
    cuboid(.17,.07,base,screenBottom+5,['#434b45','#434b45','#333b34','#747a72']) +
    cuboid(width/2-.02,.05,screenBottom,height,['#263535','#555b55','#404741','#717872']) + '</svg>';
}
(async () => {
  const dir = path.join(__dirname, 'guides');
  fs.mkdirSync(dir,{recursive:true});
  for (const [id, model] of Object.entries(models))
    for (const d of 'abcd')
      await sharp(Buffer.from(drawGuide(model,d))).resize({width:576}).png().toFile(path.join(dir,id+'_'+d+'.png'));
})().catch(error => { console.error(error); process.exitCode = 1; });
