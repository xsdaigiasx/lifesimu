// Offline asset registration/export only. Artwork is generated with image_gen.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '../..');
const HERE = __dirname;
const json = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const project = p => path.relative(ROOT, p).replaceAll('\\', '/');
async function readClean(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bb = [info.width, info.height, 0, 0];
  // Reject the generator's translucent exterior halo before antialiased resize.
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const n = (y * info.width + x) * 4;
    if (data[n + 3] < 245) data.fill(0, n, n + 4);
    else {
      data[n + 3] = 255;
      bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y);
      bb[2] = Math.max(bb[2], x + 1); bb[3] = Math.max(bb[3], y + 1);
    }
  }
  return { data, info, bb };
}
async function main() {
  for (const dir of ['sources', 'furniture', 'previews']) fs.mkdirSync(path.join(HERE, dir), { recursive: true });
  const input = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2])) : null;
  if (input) {
    const prompts = { issue: 124, tool: 'image_gen (built-in)', references: 'Original project geometry and artwork generated in this conversation; no third-party reference artwork.', room: 'Restyle original room-master-storybook shell with the approved colored-pencil style. Preserve 8x8 room, kitchen (0,0) 5x1, bath (5,0) 3x3 and opening y=3, x=6..7. No movable furniture. Transparent exterior.', items: [] };
    for (const item of [{ id: 'room', source: input.room.source }, ...input.items]) {
      const filename = `${item.id}${item.direction ? '-' + item.direction : ''}.webp`;
      await sharp(item.source).webp({ quality: 93, alphaQuality: 100, effort: 6 }).toFile(path.join(HERE, 'sources', filename));
      if (item.prompt) prompts.items.push({ id: item.id, direction: item.direction, source: `sources/${filename}`, prompt: item.prompt });
    }
    // The selected room preview is used as a visual guide, never as a game background.
    await sharp(input.styleReference).resize({ width: 760 }).webp({ quality: 84 }).toFile(path.join(HERE, 'previews/style-reference.webp'));
    json(path.join(HERE, 'prompts.json'), prompts);
  }
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/storybook-lot5/manifest.json')));
  const items = [];
  for (const template of old.items.filter(i => ['bed', 'wardrobe', 'desk'].includes(i.id) && i.model === 'comfort')) {
    const source = path.join(HERE, `sources/${template.id}-${template.direction}.webp`);
    const { data, info, bb } = await readClean(source);
    const [l, t, r, b] = template.alpha_bbox_px;
    const sprite = await sharp(data, { raw: info }).extract({ left: bb[0], top: bb[1], width: bb[2] - bb[0], height: bb[3] - bb[1] }).resize(r - l, b - t, { fit: 'fill' }).png().toBuffer();
    const [width, height] = template.frame_px;
    const png = await sharp({ create: { width, height, channels: 4, background: '#00000000' } }).composite([{ input: sprite, left: l, top: t }]).png({ compressionLevel: 9 }).toBuffer();
    const output = path.join(HERE, 'furniture', path.basename(template.file));
    fs.writeFileSync(output, png);
    items.push({ ...template, file: project(output), bytes: png.length, sha256: sha(png), source: project(source), registration: { method: 'alpha-bbox-to-original-template; no rotation or mirroring', source_bbox_px: bb, destination_bbox_px: template.alpha_bbox_px, template_file: `app/public${template.file}` } });
  }
  const roomSource = path.join(HERE, 'sources/room.webp');
  const roomClean = await readClean(roomSource);
  const cleaned = path.join(HERE, '.room-clean.png');
  await sharp(roomClean.data, { raw: roomClean.info }).png().toFile(cleaned);
  const registered = path.join(HERE, '.room-registered.png');
  // Three measured floor-surface corners determine an affine registration;
  // the inferred fourth corner (723,349) maps to the required origin (724,350).
  execFileSync('convert', [cleaned, '-virtual-pixel', 'transparent', '-define', 'distort:viewport=1448x1086+0+0', '+distort', 'Affine', '196,633 212,606 1251,632 1236,606 724,916 724,862', registered]);
  const roomFile = path.join(HERE, 'room-master-storybook.webp');
  await sharp(registered).webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(roomFile);
  fs.unlinkSync(cleaned); fs.unlinkSync(registered);
  const roomBuffer = fs.readFileSync(roomFile);
  const room = { id: 'room-master-storybook', file: project(roomFile), frame_px: [1448,1086], origin_px: [724,350], tile_px: [128,64], floor_tiles: [8,8], floor_corners_px: [[724,350],[1236,606],[724,862],[212,606]], anchor_px: [724,862], kitchen: { x:0,y:0,w:5,h:1 }, bath: { x:5,y:0,w:3,h:3 }, bath_opening: { axis:'y',at:3,from:6,to:7 }, registration: { source_surface_corners_px: [[196,633],[1251,632],[724,916]], target_surface_corners_px: [[212,606],[1236,606],[724,862]], method:'affine registration, no perspective warp' }, bytes:roomBuffer.length,sha256:sha(roomBuffer) };
  json(path.join(HERE, 'manifest.json'), { schema_version: 1, issue: 124, status: 'trial-for-review', projection: 'orthographic-2:1', tile_px: [128,64], z_px: 32, geometry: 'x=724+64*(x-y); y=350+32*(x+y)-z', anchor: 'actual bottom footprint vertex from lot5; rectangles are not centered', runtime_changed: false, room, items });
  console.log(`Exported room + ${items.length} independent sprites`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
