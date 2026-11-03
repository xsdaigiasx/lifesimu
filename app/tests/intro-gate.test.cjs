'use strict';
// Unit tests invoke the compiled React component's actual handlers. The small
// hook/JSX harness models rerenders and audio elements; it is not browser QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const compiled = path.join(root, '.test-build/components/Intro.js');
const storyModule = require(path.join(root, '.test-build/domain/story.js'));
const source = fs.readFileSync(compiled, 'utf8');

class AudioMock {
  constructor(src) {
    this.src = src; this.paused = true; this.ended = false; this.t = 0;
    this.seeks = 0; this.plays = 0; this.volume = 1; this.loop = false; this.muted = false;
  }
  set currentTime(value) { this.t = value; this.seeks++; }
  get currentTime() { return this.t; }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
}

function text(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : '';
}
function search(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) { const match = search(child, predicate); if (match) return match; }
  } else if (node && typeof node === 'object') {
    if (predicate(node)) return node;
    return search(node.props?.children, predicate);
  }
  return null;
}
function each(node, fn) {
  if (Array.isArray(node)) node.forEach(child => each(child, fn));
  else if (node && typeof node === 'object') { fn(node); each(node.props?.children, fn); }
}

function harness(overrides = {}) {
  const states = [], refs = [], media = new Map(), pendingFrames = new Map();
  let stateCursor = 0, refCursor = 0, frameId = 0, tree;
  const calls = { completed: [], resumed: 0, retries: 0 };
  const props = {
    profile: { name: 'Nguyễn An', gender: 'female', complete: true },
    canResume: true, initialMapReady: false, mapError: null,
    onComplete: profile => calls.completed.push(profile),
    onResume: () => { calls.resumed++; },
    onRetryMap: () => { calls.retries++; },
    ...overrides,
  };
  const hooks = {
    useState(initial) {
      const i = stateCursor++;
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
    useRef(initial) { const i = refCursor++; return refs[i] ??= { current: initial }; },
    useCallback(callback) { return callback; },
    // Effects requiring a real document are deliberately outside these unit tests.
    useEffect() {},
  };
  const jsx = (type, properties, key) => ({ type, props: properties, key });
  const scope = {
    exports: {}, Intl,
    matchMedia: () => ({ matches: false }),
    Image: class { constructor() { this.decoding = 'async'; } },
    requestAnimationFrame(callback) { const id = ++frameId; pendingFrames.set(id, callback); return id; },
    cancelAnimationFrame(id) { pendingFrames.delete(id); },
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
      if (name === '../domain/story') return storyModule;
      throw new Error('Unexpected component dependency: ' + name);
    },
  };
  vm.createContext(scope); vm.runInContext(source, scope, { filename: compiled });
  function render() {
    stateCursor = 0; refCursor = 0;
    tree = scope.exports.default(props);
    each(tree, node => {
      if (node.type !== 'audio') return;
      const key = node.props['data-sound'];
      if (!media.has(key)) media.set(key, new AudioMock(node.props.src));
      if (typeof node.props.ref === 'function') node.props.ref(media.get(key));
    });
    return tree;
  }
  function find(predicate) { return search(tree, predicate); }
  const button = label => find(node => node.type === 'button' && (node.props['aria-label'] === label || text(node) === label));
  function click(label) { const node = button(label); assert(node, 'Missing button: ' + label); node.props.onClick(); render(); }
  function tag() { return text(find(node => node.props?.className === 'intro-tag')); }
  function start() {
    const form = find(node => node.type === 'form'); assert(form, 'Missing setup form');
    form.props.onSubmit({ preventDefault() {} }); render();
  }
  function advanceBeat() {
    const before = tag(); assert(before, 'Not in an active story');
    for (let i = 0; i < 3 && tag() === before; i++) {
      const caption = find(node => node.props?.className?.split(' ').includes('intro-caption'));
      assert(caption, 'Missing story caption'); caption.props.onClick(); render();
    }
    assert.notEqual(tag(), before, 'Caption taps must reveal then advance the beat');
  }
  function frame(now) {
    const next = pendingFrames.entries().next().value;
    assert(next, 'No pending animation frame'); pendingFrames.delete(next[0]); next[1](now); render();
  }
  render();
  return { props, calls, media, render, find, button, click, start, advanceBeat, tag, frame };
}

// Resume must remain blocked even if a caller invokes its handler directly,
// bypassing the HTML disabled attribute. The ready state can change in place.
{
  const h = harness();
  const resume = h.button('TIẾP TỤC GAME ĐANG CHƠI');
  assert.equal(resume.props.disabled, true);
  resume.props.onClick(); resume.props.onClick();
  assert.equal(h.calls.resumed, 0);
  h.props.initialMapReady = true; h.render();
  const ready = h.button('TIẾP TỤC GAME ĐANG CHƠI');
  assert.equal(ready.props.disabled, false);
  ready.props.onClick(); ready.props.onClick();
  assert.equal(h.calls.resumed, 1);
  assert.equal(h.calls.completed.length, 0);
}

// Skip may reach the final card, but cannot enter a blank map. Retrying is
// independent from completion; the callback fires at most once when ready.
{
  const h = harness({ canResume: false, mapError: 'failed tile' });
  assert.equal(h.button('TIẾP TỤC GAME ĐANG CHƠI'), null);
  h.start(); h.click('Bỏ qua đoạn mở đầu');
  const enter = h.button('BƯỚC VÀO THÀNH PHỐ');
  assert.equal(enter.props['aria-disabled'], true);
  enter.props.onClick(); enter.props.onClick();
  assert.equal(h.calls.completed.length, 0);
  h.click('Thử tải lại bản đồ'); assert.equal(h.calls.retries, 1);
  h.props.mapError = null; h.props.initialMapReady = true; h.render();
  const ready = h.button('BƯỚC VÀO THÀNH PHỐ'); assert.equal(ready.props['aria-disabled'], false);
  ready.props.onClick(); ready.props.onClick();
  assert.equal(h.calls.completed.length, 1);
  assert.equal(h.calls.completed[0].name, 'Nguyễn An');
  assert.equal(h.calls.completed[0].gender, 'female');
  assert.equal(h.calls.completed[0].complete, true);
  assert.equal(h.calls.resumed, 0);
}

// Progressing captions, changing art, mute and pause/resume must never seek
// or restart music. The only permitted reset is an explicit fresh replay.
{
  const h = harness({ initialMapReady: true }); h.start();
  const music = h.media.get('music'), birds = h.media.get('birds'), starter = h.media.get('starter'), city = h.media.get('city');
  assert(music.src.endsWith('intro/audio/journey-new.ogg'));
  assert.equal(music.paused, false); assert.equal(music.seeks, 1);
  music.t = 12; const seeks = music.seeks, plays = music.plays;
  h.frame(1000); h.frame(1100);
  assert.equal(music.currentTime, 12); assert.equal(music.seeks, seeks);
  h.advanceBeat(); // Black -> rural first image.
  assert.equal(birds.paused, false);
  assert(birds.src.endsWith('intro/audio/morning-real.ogg'));
  // morning-real already contains the original00:08–00:46 segment, so it
  // must play from0 instead of accidentally cropping another8 seconds.
  assert.equal(birds.currentTime, 0);
  const birdSeeks = birds.seeks;
  h.advanceBeat(); h.advanceBeat();
  assert.equal(birds.seeks, birdSeeks); assert.equal(music.seeks, seeks); assert.equal(music.plays, plays);
  h.click('Tắt âm thanh'); assert.equal(music.muted, true); assert.equal(music.currentTime, 12);
  h.click('Tạm dừng'); assert.equal(music.paused, true);
  h.click('Tiếp tục'); assert.equal(music.paused, false); assert.equal(music.currentTime, 12); assert.equal(music.seeks, seeks);
  h.advanceBeat(); // Departure: stop birds, start the already-cropped7s ignition.
  assert.equal(birds.paused, true); assert.equal(starter.paused, false);
  assert(starter.src.endsWith('intro/audio/bus-start-real.ogg')); assert.equal(starter.currentTime, 0); assert.equal(starter.seeks, 1);
  h.advanceBeat(); // Boarding ends ignition and starts the engine bed.
  assert.equal(starter.paused, true); assert.equal(h.media.get('engine').paused, false);
  h.advanceBeat(); h.advanceBeat(); h.advanceBeat(); // Open door, not yet arrival.
  assert.equal(city.paused, true);
  h.advanceBeat(); // Actual arrival image, beat9.
  assert.equal(city.paused, false); assert(city.src.endsWith('intro/audio/street-real.ogg'));
  const citySeeks = city.seeks;
  h.advanceBeat(); assert.equal(city.seeks, citySeeks); assert.equal(music.seeks, seeks);
  h.click('Bỏ qua đoạn mở đầu');
  for (const element of h.media.values()) assert.equal(element.paused, true);
  assert.equal(h.button('Xem lại đoạn mở đầu'), null);
}

for (const name of ['journey-new.ogg', 'morning-real.ogg', 'bus-start-real.ogg', 'street-real.ogg']) {
  const file = path.join(root, 'public/intro/audio', name);
  assert(fs.statSync(file).size > 0, 'Missing audio asset: ' + name);
}
console.log('PASS: React intro resume/final map-ready guards, skip/retry and duplicate clicks; music seeks only on replay; original cropped audio sources and arrival timing preserved.');
