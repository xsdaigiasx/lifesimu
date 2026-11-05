const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {engine} = require('../../app/.test-build/domain/engine');
const {clockOf} = require('../../app/.test-build/domain/time');
const {startRent} = require('../../app/.test-build/domain/rent');
const {tiles} = require('./manifest.json');

const viewport = {width: 390, height: 844};
const origin = 'http://127.0.0.1:4174';

async function enterPlace(page) {
  await page.locator('.placebar').getByRole('button', {name: /^Vào/}).click();
}

const screens = [
  {name: 'market', location: 'market', group: 'market', open: enterPlace},
  {name: 'mall', location: 'mall', group: 'shop', open: enterPlace},
  {name: 'phone', location: 'home', group: 'shop', omit: ['shop-bag'], async open(page) {
    await page.getByRole('button', {name: 'Điện thoại', exact: true}).click();
    await page.getByRole('button', {name: 'Mua sắm', exact: true}).click();
  }},
  {name: 'kitchen', location: 'home', group: 'kitchen', async open(page) {
    await enterPlace(page);
    await page.getByRole('button', {name: 'Vào phòng', exact: true}).click();
    await page.getByRole('button', {name: 'Bếp nấu', exact: true}).click();
    await page.getByText('Đã về phòng trọ.', {exact: true}).waitFor({state: 'hidden'});
  }},
];

async function review(browser, screen) {
  const context = await browser.newContext({viewport, deviceScaleFactor: 1});
  try {
    const base = startRent({...engine.initial(), money: 50_000_000});
    const save = {...base, clock: {...clockOf(base), location: screen.location}};
    assert(engine.parse(JSON.stringify(save)), 'QA save must be valid');
    await context.addInitScript(({key, save}) => {
      localStorage.setItem(key, JSON.stringify(save));
      localStorage.setItem('life-simulator-profile-v1',
        JSON.stringify({name: 'Lâm', gender: 'male', complete: true}));
    }, {key: engine.KEY, save});
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(origin, {waitUntil: 'networkidle'});
    await screen.open(page);
    const expected = tiles.filter(tile =>
      tile.id.startsWith(screen.group + '-') && !screen.omit?.includes(tile.id));
    const images = page.locator('img[src^="/assets/tiles/"]');
    await images.first().waitFor({state: 'visible'});
    const actual = await images.evaluateAll(async items => Promise.all(items.map(async image => {
      await image.decode();
      const box = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {file: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight,
        frame: [box.width, box.height], fit: style.objectFit, position: style.objectPosition,
        inButton: !!image.closest('button')};
    })));
    assert.deepEqual(actual.map(i => i.file).sort(), expected.map(i => i.file).sort(), screen.name);

    for (const image of actual) {
      const tile = expected.find(tile => tile.file === image.file);
      const [w, h] = image.frame;
      assert.deepEqual([image.width, image.height], tile.frame_px);
      assert(image.inButton && w > 0 && h > 0);
      assert.equal(image.fit, 'cover');
      assert.equal(image.position, '50% 50%');
      const scale = Math.max(w / image.width, h / image.height);
      const insetX = (image.width - w / scale) / 2;
      const insetY = (image.height - h / scale) / 2;
      const art = tile.alpha_bounds_px;
      assert(art.left >= insetX && art.left + art.width <= image.width - insetX &&
        art.top >= insetY && art.top + art.height <= image.height - insetY,
        screen.name + ' clips ' + image.file);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({path: path.join(__dirname, screen.name + '-390x844.png')});
    return {screen: screen.name, tiles: actual.length, allArtInsideCrop: true,
      files: actual.map(image => image.file)};
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const checks = [];
  try {
    for (const screen of screens) checks.push(await review(browser, screen));
  } finally {
    await browser.close();
  }
  const result = {result: 'PASS', viewport, checks};
  await fs.writeFile(path.join(__dirname, 'mobile-validation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(checks.map(check => check.screen + ': ' + check.tiles).join(', '));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
