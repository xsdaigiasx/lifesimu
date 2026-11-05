const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'app/public/assets/tiles');
const runtime = path.join(root, 'app/src/domain/tile-art.json');
const width = 360, height = 160;
const safeWidth = 244, safeHeight = 120;
const cards = {
  'market-veg': '#d9ecc8', 'market-meat': '#f1d2cc', 'market-dry': '#f2e6c4',
  'shop-clothing': '#f3e2d6', 'shop-electronics': '#dfe8ef', 'shop-transport': '#e4ecd6',
  'shop-bag': '#ead9c4', 'shop-furniture': '#e9e1cf',
  'kitchen-recipes': '#eef1e5', 'kitchen-improv': '#eef1e5',
  'kitchen-pantry': '#eef1e5', 'kitchen-meals': '#eef1e5',
};
const sha256 = data => createHash('sha256').update(data).digest('hex');
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');

async function alphaBounds(image) {
  const {data, info} = await sharp(image).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  assert(left < right && top < bottom, 'Expected a visible transparent cutout');
  return {left, top, width: right - left + 1, height: bottom - top + 1};
}

async function render(id, sourcePath) {
  const source = await fs.readFile(sourcePath);
  const crop = await alphaBounds(source);
  assert((await sharp(source).metadata()).hasAlpha, id + ' missing source alpha');
  const cutout = await sharp(source).extract(crop).resize(safeWidth, safeHeight, {fit: 'inside'})
    .png().toBuffer();
  const dimensions = await sharp(cutout).metadata();
  const left = Math.floor((width - dimensions.width) / 2);
  const top = Math.floor((height - dimensions.height) / 2);
  const image = await sharp({create: {width, height, channels: 4, background: '#00000000'}})
    .composite([{input: cutout, left, top}]).webp({lossless: true, effort: 6}).toBuffer();
  const bounds = await alphaBounds(image);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, 'webp');
  assert(metadata.hasAlpha && image.length < 150_000, id);
  assert.deepEqual([metadata.width, metadata.height], [width, height]);
  assert(bounds.left >= 58 && bounds.top >= 20 &&
    bounds.left + bounds.width <= 302 && bounds.top + bounds.height <= 140, id);
  const file = '/assets/tiles/' + id + '.webp';
  return {image, entry: {id, file, frame_px: [width, height], alpha_bounds_px: bounds,
    bytes: image.length, sha256: sha256(image), source_sha256: sha256(source)}};
}

async function preview(tiles) {
  const cellWidth = 386, cellHeight = 225;
  const W = cellWidth * 3, H = cellHeight * 4;
  let labels = '';
  const layers = [];
  for (const [i, {image, entry}] of tiles.entries()) {
    const left = (i % 3) * cellWidth + 13;
    const top = Math.floor(i / 3) * cellHeight + 40;
    const card = await sharp({create: {width, height, channels: 3, background: cards[entry.id]}})
      .composite([{input: image, left: 0, top: 0}]).png().toBuffer();
    layers.push({input: card, left, top});
    labels += '<text x="' + left + '" y="' + (top - 12) + '">' + entry.id + '</text>';
  }
  const overlay = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + W +
    '" height="' + H + '"><g font-family="Arial" font-size="16" fill="#354639">' +
    labels + '</g></svg>');
  layers.push({input: overlay, left: 0, top: 0});
  await sharp({create: {width: W, height: H, channels: 3, background: '#f5f2e8'}})
    .composite(layers).webp({quality: 94}).toFile(path.join(__dirname, 'contact-sheet.webp'));
}

async function main() {
  const sources = await readJson(path.join(__dirname, 'sources.local.json'));
  const keys = await readJson(runtime);
  const tiles = [];
  for (const id of Object.keys(cards)) {
    assert(sources[id], 'Missing image master for ' + id);
    tiles.push(await render(id, sources[id]));
  }
  const entries = tiles.map(tile => tile.entry);
  assert.equal(new Set(entries.map(tile => tile.sha256)).size, entries.length);
  await fs.mkdir(output, {recursive: true});
  for (const {image, entry} of tiles) await fs.writeFile(path.join(output, entry.id + '.webp'), image);
  await writeJson(runtime, [...new Set([...keys, ...Object.keys(cards)])]);
  await writeJson(path.join(__dirname, 'manifest.json'), {issue: 266, lot: 2, tiles: entries});
  await preview(tiles);
  console.log({tiles: entries.length, totalBytes: entries.reduce((sum, tile) => sum + tile.bytes, 0),
    maxBytes: Math.max(...entries.map(tile => tile.bytes))});
}

main().catch(error => { console.error(error); process.exitCode = 1; });
