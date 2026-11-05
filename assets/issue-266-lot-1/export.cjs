const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '../..');
const width = 192;
const heights = {basic: 60, comfort: 79, premium: 96};
const assetDir = path.join(root, 'app/public/assets/furniture');
const runtimePath = path.join(root, 'app/src/domain/furniture-sprites.json');
const manifestPath = path.join(root, 'assets/furniture/manifest.json');
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function bounds(input) {
  const {data, info} = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 128) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  assert(left < right && top < bottom, 'source must have a nonempty alpha silhouette');
  assert(left > 0 || right < info.width - 1 || top > 0 || bottom < info.height - 1, 'expected a cutout');
  return {left, top, right, bottom, width: right-left+1, height: bottom-top+1};
}

async function exportView(model, direction, sourcePath) {
  const source = await fs.readFile(sourcePath);
  const key = model + '_' + direction;
  const silhouette = await bounds(source);
  const guide = await bounds(path.join(__dirname, 'guides', key + '.png'));
  const crop = {
    left: silhouette.left,
    top: silhouette.top,
    width: silhouette.width,
    height: silhouette.height,
  };
  const height = 96 + heights[model];
  const turned = direction === 'b' || direction === 'd';
  const [fw, fh] = turned ? [1, 2] : [2, 1];
  const ax = fw * 64;
  const fit = Math.min(guide.width / 3 / crop.width, guide.height / 3 / crop.height);
  const w = Math.round(crop.width * fit);
  const h = Math.round(crop.height * fit);
  const left = Math.round((guide.left + guide.right) / 6 - w / 2);
  const guideTop = Math.round(guide.bottom / 3) - h + 1;
  const sprite = await sharp(source).extract(crop).resize(w, h, {fit: 'fill'}).png().toBuffer();
  // Move the subject a few pixels toward the back of the footprint when a
  // generated plinth corner runs past the foreground edges. Keep all pixels.
  const alpha = await sharp(sprite).ensureAlpha().raw().toBuffer();
  let overrun = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[(y * w + x) * 4 + 3] < 16) continue;
      const frontEdge = height - 1 - Math.abs(left + x - ax) / 2;
      overrun = Math.max(overrun, guideTop + y - frontEdge);
    }
  }
  const top = guideTop - Math.ceil(overrun);
  assert(top >= 0 && left >= 0 && left + w <= width && top + h <= height, key);
  const buffer = await sharp({create: {width, height, channels: 4, background: '#00000000'}})
    .composite([{input: sprite, left, top}])
    .webp({lossless: true, effort: 6})
    .toBuffer();
  const meta = await sharp(buffer).metadata();
  assert(meta.hasAlpha && meta.format === 'webp' && buffer.length < 150_000, key);
  assert.deepEqual([meta.width, meta.height], [width, height], key);

  const id = 'tv-' + model;
  const file = id + '_' + direction + '.webp';
  const output = '/assets/furniture/' + file;
  await fs.writeFile(path.join(assetDir, file), buffer);
  return {
    runtime: {f: output, w: width, h: height, ax, ay: height, fw, fh},
    asset: {id, file, direction, variant: 'default', footprint_tiles: [fw, fh],
      height_px: heights[model], height_z: heights[model] / 32,
      frame_px: [width, height], anchor_px: [ax, height],
      bytes: buffer.length, sha256: sha256(buffer), source_sha256: sha256(source)},
  };
}

async function reviewSheet(assets) {
  const cellW = 300, cellH = 310;
  const W = cellW * 4, H = cellH * 3;
  const images = [];
  let marks = '';
  for (const [i, asset] of assets.entries()) {
    const x = i % 4 * cellW, y = Math.floor(i / 4) * cellH;
    const [fw, fh] = asset.footprint_tiles;
    const [ax, ay] = asset.anchor_px;
    const X = x + 54, Y = y + 258;
    const point = (a, b) => [X + fh * 64 + 64 * (a - b), Y - 96 + 32 * (a + b)];
    const diamond = [point(0, 0), point(fw, 0), point(fw, fh), point(0, fh)];
    const cells = Array.from({length: fw * fh}, (_, index) => {
      const a = index % fw, b = Math.floor(index / fw);
      const coords = [point(a,b), point(a+1,b), point(a+1,b+1), point(a,b+1)];
      return '<polygon points="' + coords.map(p => p.join(',')).join(' ') + '"/>';
    }).join('');
    marks += '<g fill="#e2d6bb" stroke="#a49372" stroke-width="1">' + cells + '</g>';
    marks += '<circle cx="' + diamond[2][0] + '" cy="' + Y + '" r="3" fill="#96703e"/>';
    marks += '<text x="' + (x+14) + '" y="' + (y+30) + '">' + asset.id + ' / ' + asset.direction + '</text>';
    marks += '<text x="' + (x+14) + '" y="' + (y+291) + '" font-size="13">' +
      asset.footprint_tiles.join('×') + ' ô · ' + asset.frame_px.join('×') + ' px · neo ' +
      ax + ', ' + ay + '</text>';
    images.push({input: path.join(assetDir, asset.file), left: X, top: Y - ay});
  }
  const overlay = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + W +
    '" height="' + H + '"><g font-family="Arial" fill="#363e35">' + marks + '</g></svg>');
  await sharp({create: {width: W, height: H, channels: 4, background: '#f4f0e5'}})
    .composite([{input: overlay, left: 0, top: 0}, ...images])
    .webp({quality: 94}).toFile(path.join(__dirname, 'tv-grid-review.webp'));
}

async function main() {
  const sources = await readJson(path.join(__dirname, 'sources.local.json'));
  const runtime = await readJson(runtimePath);
  const manifest = await readJson(manifestPath);
  const assets = [];
  for (const model of Object.keys(heights)) {
    for (const direction of 'abcd') {
      const key = model + '_' + direction;
      assert(sources[key], 'Missing source ' + key);
      const view = await exportView(model, direction, sources[key]);
      runtime['tv-' + key] = view.runtime;
      assets.push(view.asset);
    }
  }
  assert.equal(new Set(assets.map(a => a.sha256)).size, 12, 'Each view must be distinct');
  manifest.assets = [...manifest.assets.filter(a => !a.id.startsWith('tv-')), ...assets];
  await fs.writeFile(runtimePath, JSON.stringify(runtime) + '\n');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await reviewSheet(assets);
  console.log({views: assets.length, maxBytes: Math.max(...assets.map(a => a.bytes))});
}

main().catch(error => { console.error(error); process.exitCode = 1; });
