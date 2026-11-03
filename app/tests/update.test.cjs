const assert = require('node:assert/strict');
const fs = require('node:fs');
const {parseRemoteVersion, hasNewVersion, fetchRemoteVersion, BUILD_ID} = require('../.test-build/domain/update');
assert.equal(BUILD_ID, 'dev');
assert.deepEqual(parseRemoteVersion({build: 'abc1234', version: '0.36.0'}), {build: 'abc1234', version: '0.36.0'});
for (const bad of [null, 1, 'x', {}, {build: '', version: '1'}, {build: 'a', version: 2}, {build: 'x'.repeat(65), version: '1'}]) assert.equal(parseRemoteVersion(bad), null);
// Chỉ báo khi chắc chắn khác; bản dev và lỗi mạng không bao giờ báo.
assert.ok(hasNewVersion('abc1234', {build: 'def5678', version: '0.36.1'}));
assert.ok(!hasNewVersion('abc1234', {build: 'abc1234', version: '0.36.0'}));
assert.ok(!hasNewVersion('dev', {build: 'def5678', version: '0.36.1'}));
assert.ok(!hasNewVersion('abc1234', null));
(async () => {
  const ok = async () => ({ok: true, json: async () => ({build: 'n1', version: '1.0.0'})});
  assert.deepEqual(await fetchRemoteVersion(ok), {build: 'n1', version: '1.0.0'});
  assert.equal(await fetchRemoteVersion(async () => ({ok: false, json: async () => ({})})), null);
  assert.equal(await fetchRemoteVersion(async () => { throw new Error('offline'); }), null);
  assert.equal(await fetchRemoteVersion(async () => ({ok: true, json: async () => { throw new Error('bad json'); }})), null);
  // Manifest và icon: đủ để Chrome và Safari cho phép cài.
  const m = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.equal(m.display, 'standalone'); assert.ok(m.name && m.short_name && m.start_url && m.theme_color && m.background_color);
  const sizes = m.icons.map(i => i.sizes + ':' + i.purpose); for (const need of ['192x192:any', '512x512:any', '512x512:maskable']) assert.ok(sizes.includes(need), need);
  for (const i of m.icons) assert.ok(fs.statSync('public/' + i.src).size > 500, i.src);
  assert.ok(fs.existsSync('public/icons/apple-touch-icon.png')); assert.ok(fs.existsSync('public/sw.js'));
  const html = fs.readFileSync('index.html', 'utf8');
  for (const part of ['rel="manifest"', 'apple-touch-icon', 'apple-mobile-web-app-capable', 'viewport-fit=cover', 'app-shell.css']) assert.ok(html.includes(part), part);
  assert.ok(!html.includes('data:image/svg+xml'), 'không còn favicon dạng data URI');
  console.log('PASS: cập nhật phiên bản và PWA — so mã bản dựng, lỗi mạng, manifest, icon, thẻ meta.');
})();
