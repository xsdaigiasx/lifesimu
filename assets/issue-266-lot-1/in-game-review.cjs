const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {engine} = require('../../app/.test-build/domain/engine');
const {startRent} = require('../../app/.test-build/domain/rent');
const {buyHome, homeOf, saveHome} = require('../../app/.test-build/domain/home');
const sprites = require('../../app/src/domain/furniture-sprites.json');

const origin = 'http://127.0.0.1:4174';
const viewport = {width: 390, height: 844};

function fixture(model, rotation) {
  const base = startRent({...engine.initial(), money: 50_000_000});
  const purchase = buyHome(base, 'tv', model);
  assert(purchase.ok, purchase.error);
  const items = homeOf(purchase.state).items.map(item => item.id === 'tv'
    ? {...item, x: 3, y: 6, placed: true, rotation}
    : item);
  const layout = saveHome(purchase.state, items);
  assert(layout.ok, layout.error);
  assert(engine.parse(JSON.stringify(layout.state)));
  return layout.state;
}

async function review(browser, model, direction) {
  const context = await browser.newContext({viewport, deviceScaleFactor: 1});
  try {
    const rotation = 'abcd'.indexOf(direction) * 90;
    const state = fixture(model, rotation);
    await context.addInitScript(({key, state}) => {
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem('life-simulator-profile-v1',
        JSON.stringify({name: 'Lâm', gender: 'male', complete: true}));
    }, {key: engine.KEY, state});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(origin, {waitUntil: 'networkidle'});
    await page.locator('.placebar').getByRole('button', {name: /^(Vào|Đến)/}).click();
    await page.getByRole('button', {name: 'Vào phòng', exact: true}).click();
    const sprite = sprites['tv-' + model + '_' + direction];
    const image = page.locator('.home-scene img[src="' + sprite.f + '"]');
    await image.waitFor({state: 'visible'});
    const dimensions = await image.evaluate(async img => {
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    });
    assert.deepEqual(dimensions, [sprite.w, sprite.h]);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > 390), false);
    assert.deepEqual(errors, []);
    if (direction === 'a') {
      await page.screenshot({path: path.join(__dirname, 'in-game-' + model + '-390x844.png')});
    }
    return {model, direction, rotation, file: sprite.f, dimensions};
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const views = [];
  try {
    for (const model of ['basic', 'comfort', 'premium']) {
      for (const direction of 'abcd') views.push(await review(browser, model, direction));
    }
  } finally {
    await browser.close();
  }
  const result = {result: 'PASS', viewport, surface: 'production rental room, synthetic saves', views};
  await fs.writeFile(path.join(__dirname, 'in-game-validation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log({result: result.result, views: views.length, viewport});
}

main().catch(error => { console.error(error); process.exitCode = 1; });
