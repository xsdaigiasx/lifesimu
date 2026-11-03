import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Gender, PlayerProfile } from '../domain/types';
import { shotURL, story } from '../domain/story';

export interface IntroProps {
  profile: PlayerProfile | null;
  canResume: boolean;
  onComplete: (profile: PlayerProfile) => void;
  onResume: () => void;
  initialMapReady: boolean;
  mapError: string | null;
  onRetryMap: () => void;
}

type Sound = 'music' | 'engine' | 'starter' | 'brake' | 'door' | 'footsteps' | 'birds' | 'city' | 'message';
const SOUND_FILES: Record<Sound, string> = {
  music: 'journey-new.ogg', engine: 'sfx_04_bus_engine.ogg', starter: 'bus-start-real.ogg',
  brake: 'sfx_05_bus_brake.ogg', door: 'sfx_06_bus_door.ogg', footsteps: 'sfx_02_footsteps.ogg',
  birds: 'morning-real.ogg', city: 'street-real.ogg', message: 'sfx_08_message_notification.ogg',
};
const SOUND_KEYS = Object.keys(SOUND_FILES) as Sound[];
type IconName = 'sound' | 'mute' | 'pause' | 'play' | 'skip' | 'auto' | 'retry' | 'arrow';
function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'sound' && <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>}
    {name === 'mute' && <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></>}
    {name === 'pause' && <path d="M8 5v14M16 5v14"/>}
    {name === 'play' && <path d="m8 5 11 7-11 7V5Z"/>}
    {name === 'skip' && <><path d="m5 5 10 7L5 19V5Z"/><path d="M19 5v14"/></>}
    {(name === 'auto' || name === 'retry') && <path d="M4 8a8 8 0 0 1 13-2l3 3M20 4v5h-5M20 16a8 8 0 0 1-13 2l-3-3M4 20v-5h5"/>}
    {name === 'arrow' && <path d="M4 12h15m-5-5 5 5-5 5"/>}
  </svg>;
}

export default function Intro({ profile, canResume, onComplete, onResume, initialMapReady, mapError, onRetryMap }: IntroProps) {
  const [mode, setMode] = useState<'setup' | 'story' | 'end'>('setup');
  const [name, setName] = useState(profile?.name ?? '');
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male');
  const [muted, setMuted] = useState(false);
  const [auto, setAuto] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [forced, setForced] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [shotSlots, setShotSlots] = useState<[string, string]>([shotURL('01_dawn', gender), '']);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [reduceMotion, setReduceMotion] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const audio = useRef<Partial<Record<Sound, HTMLAudioElement>>>({});
  const activeSounds = useRef(new Set<Sound>());
  const raf = useRef(0), lastTick = useRef<number | null>(null), lastPaint = useRef(0);
  const clock = useRef(0), currentBeat = useRef(-1), currentScene = useRef('');
  const playingRef = useRef(false), autoRef = useRef(true), mutedRef = useRef(false);
  const forcedRef = useRef(false), modeRef = useRef<'setup' | 'story' | 'end'>('setup');
  const continued = useRef(false), activeSlotRef = useRef<0 | 1>(0);
  const displayedShot = useRef(shotURL('01_dawn', gender));
  const warmImages = useRef<HTMLImageElement[]>([]);
  const root = useRef<HTMLElement | null>(null);
  const latestNext = useRef<() => void>(() => {}), latestPause = useRef<() => void>(() => {});

  const pauseSound = useCallback((key: Sound) => { audio.current[key]?.pause(); activeSounds.current.delete(key); }, []);
  const stopAll = useCallback(() => { for (const key of SOUND_KEYS) audio.current[key]?.pause(); activeSounds.current.clear(); }, []);
  const playSound = useCallback((key: Sound, loop = false, volume = .4) => {
    const element = audio.current[key];
    if (!element) return;
    element.loop = loop; element.volume = volume; element.muted = mutedRef.current;
    // Seeking is deliberate only when starting a sound, never when advancing music captions.
    try { element.currentTime = 0; } catch { /* Metadata may not have arrived yet. */ }
    activeSounds.current.add(key);
    void element.play().catch(() => {});
  }, []);
  const endStory = useCallback(() => {
    playingRef.current = false; modeRef.current = 'end'; setPlaying(false); setMode('end');
    cancelAnimationFrame(raf.current); stopAll();
  }, [stopAll]);
  const changeBeat = useCallback((index: number) => {
    const beat = story.beats[index];
    currentBeat.current = index; forcedRef.current = false; setForced(false); setBeatIndex(index);
    if (currentScene.current !== beat.scene) {
      currentScene.current = beat.scene;
      pauseSound('engine'); pauseSound('birds'); pauseSound('city');
      if (beat.scene === 'rural') playSound('birds', true, .48);
      if (beat.scene === 'bus') playSound('engine', true, .16);
      if (beat.scene === 'city') { playSound('brake', false, .24); playSound('door', false, .18); }
    }
    if (index === 4) { pauseSound('birds'); playSound('starter', false, .38); }
    if (index >= 5) pauseSound('starter');
    if (index === 9) { playSound('city', true, .30); playSound('message', false, .20); }
    if (index === 10) playSound('footsteps', false, .24);
  }, [pauseSound, playSound]);
  const tick = useCallback(function tickFrame(now: number) {
    if (!playingRef.current) return;
    const beat = story.beats[Math.max(0, currentBeat.current)];
    if (lastTick.current !== null) {
      const dt = Math.min(.2, (now - lastTick.current) / 1000);
      if (autoRef.current || clock.current < beat.start + beat.duration - .05)
        clock.current = Math.min(clock.current + dt, autoRef.current ? story.duration : beat.start + beat.duration - .02);
    }
    lastTick.current = now;
    const music = audio.current.music;
    if (music) music.volume = .28 * Math.min(1, music.currentTime / 2);
    if (clock.current >= story.duration) { endStory(); return; }
    const index = story.locate(clock.current);
    if (index !== currentBeat.current) changeBeat(index);
    if (now - lastPaint.current > 30) { setElapsed(clock.current); lastPaint.current = now; }
    raf.current = requestAnimationFrame(tickFrame);
  }, [changeBeat, endStory]);

  const start = useCallback(() => {
    stopAll(); cancelAnimationFrame(raf.current); continued.current = false;
    clock.current = 0; lastTick.current = null; lastPaint.current = 0; currentBeat.current = -1; currentScene.current = '';
    modeRef.current = 'story'; playingRef.current = true; forcedRef.current = false;
    setMode('story'); setPlaying(true); setElapsed(0); setForced(false);
    warmImages.current = story.beats.filter(b => b.art).map(b => { const image = new Image(); image.decoding = 'async'; image.src = shotURL(b.art!, gender); return image; });
    playSound('music', true, 0); changeBeat(0); raf.current = requestAnimationFrame(tick);
  }, [changeBeat, gender, playSound, stopAll, tick]);
  const next = useCallback(() => {
    if (modeRef.current !== 'story' || !playingRef.current) return;
    const beat = story.beats[currentBeat.current];
    const revealed = forcedRef.current || reduceMotion || beat.scene === 'title' ? beat.text : story.reveal(beat.text, clock.current - beat.start);
    if (revealed !== beat.text) { forcedRef.current = true; setForced(true); return; }
    if (currentBeat.current === story.beats.length - 1) { endStory(); return; }
    const index = currentBeat.current + 1;
    clock.current = story.beats[index].start; setElapsed(clock.current); changeBeat(index);
  }, [changeBeat, endStory, reduceMotion]);
  const togglePause = useCallback(() => {
    if (modeRef.current !== 'story') return;
    playingRef.current = !playingRef.current; setPlaying(playingRef.current);
    if (playingRef.current) {
      lastTick.current = null;
      for (const key of activeSounds.current) { const element = audio.current[key]; if (element && !element.ended) void element.play().catch(() => {}); }
      raf.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf.current);
      for (const key of activeSounds.current) audio.current[key]?.pause();
    }
  }, [tick]);
  latestNext.current = next; latestPause.current = togglePause;

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const onReduce = () => setReduceMotion(query.matches);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.code === 'Tab') {
        const controls = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]') ?? [])].filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (target instanceof HTMLElement && (target.closest('input,textarea,select,button') || target.isContentEditable)) return;
      if ((event.code === 'Space' || event.code === 'Enter') && modeRef.current === 'story') { event.preventDefault(); latestNext.current(); }
      if (event.code === 'Escape' && modeRef.current === 'story') latestPause.current();
    };
    const onVisibility = () => { if (document.hidden && playingRef.current) latestPause.current(); };
    query.addEventListener('change', onReduce); document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onVisibility);
    root.current?.focus();
    return () => {
      query.removeEventListener('change', onReduce); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVisibility);
      playingRef.current = false; cancelAnimationFrame(raf.current); stopAll(); audio.current = {}; warmImages.current = [];
    };
  }, [stopAll]);

  const beat = story.beats[beatIndex];
  const art = mode === 'setup' ? '01_dawn' : beat.art;
  useEffect(() => {
    if (!art) return;
    const url = shotURL(art, gender);
    if (displayedShot.current === url) return;
    let cancelled = false;
    const image = new Image(); image.decoding = 'async';
    let handled = false;
    const commit = async () => {
      if (handled) return; handled = true;
      try { await image.decode(); } catch { /* A loaded image can still render where decode is unavailable. */ }
      if (cancelled || !image.naturalWidth) return;
      const slot: 0 | 1 = activeSlotRef.current === 0 ? 1 : 0;
      displayedShot.current = url; activeSlotRef.current = slot;
      setShotSlots(old => slot === 0 ? [url, old[1]] : [old[0], url]); setActiveSlot(slot);
    };
    image.onload = () => { void commit(); }; image.src = url;
    if (image.complete && image.naturalWidth) void commit();
    return () => { cancelled = true; image.onload = null; };
  }, [art, gender]);

  const finish = () => {
    if (!initialMapReady || continued.current) return;
    const cleanName = name.normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 32);
    if (!cleanName) return;
    continued.current = true; stopAll(); onComplete({ name: cleanName, gender, complete: true });
  };
  const resume = () => { if (!initialMapReady || !canResume || continued.current) return; continued.current = true; stopAll(); onResume(); };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim()) start(); };
  const toggleMute = () => { const value = !mutedRef.current; mutedRef.current = value; setMuted(value); for (const key of SOUND_KEYS) { const element = audio.current[key]; if (element) element.muted = value; } };
  const words = forced || reduceMotion || beat.scene === 'title' ? beat.text : story.reveal(beat.text, elapsed - beat.start);
  const hiddenArt = mode === 'story' && (beat.scene === 'black' || beat.scene === 'title');
  const mapStatus = !initialMapReady && <div className={`intro-map-status${mapError ? ' is-error' : ''}`} role="status">
    <span>{mapError ? 'Chưa tải được khu nhà trọ.' : 'Đang tải khu nhà trọ…'}</span>
    {mapError && <button type="button" className="intro-icon" aria-label="Thử tải lại bản đồ" onClick={onRetryMap}><Icon name="retry"/></button>}
  </div>;

  return <section ref={root} tabIndex={-1} className={`life-intro${mode === 'story' && beat.scene === 'title' ? ' titlemode' : ''}`} role="dialog" aria-modal="true" aria-label="Một đời để sống — Mở đầu">
    <div className="intro-backdrop" style={{ backgroundImage: `url("${displayedShot.current}")`, opacity: hiddenArt ? 0 : 1 }}/>
    <div className="intro-pictures" onClick={next} style={{ opacity: hiddenArt ? 0 : 1 }}>
      {shotSlots.map((url, slot) => url ? <img className={`intro-shot${activeSlot === slot ? ' active' : ''}`} key={slot} src={url} alt={activeSlot === slot ? beat.tag : ''} draggable={false} decoding="async"/> : null)}
    </div>
    <div className="intro-veil"/><div className="intro-vignette"/><div className="intro-letterbox top"/><div className="intro-letterbox bottom"/>
    {mode === 'story' && <>
      <header className="intro-header"><div className="intro-marks" aria-label="Tiến trình">{story.beats.map((_, i) => <span key={i} className={i < beatIndex ? 'done' : i === beatIndex ? 'now' : ''}/>)}</div><div className="intro-header-actions"><button type="button" className="intro-icon" aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={!muted} onClick={toggleMute}><Icon name={muted ? 'mute' : 'sound'}/></button><button type="button" className="intro-icon" aria-label="Bỏ qua đoạn mở đầu" onClick={endStory}><Icon name="skip"/></button></div></header>
      <section className={`intro-caption${words === beat.text ? ' complete' : ''}`} onClick={next} aria-label="Lời dẫn"><div className="intro-tag">{beat.tag}</div>{beat.speaker && <div className="intro-speaker">{beat.speaker}</div>}<p className="intro-words">{words}</p>{beat.sub && <div className="intro-subtitle">{beat.sub}</div>}</section>
      <div className="intro-controls"><button type="button" className="intro-icon" aria-label={auto ? 'Tắt tự chuyển cảnh' : 'Bật tự chuyển cảnh'} aria-pressed={auto} onClick={() => { autoRef.current = !autoRef.current; setAuto(autoRef.current); }}><Icon name="auto"/></button><button type="button" className="intro-icon" aria-label={playing ? 'Tạm dừng' : 'Tiếp tục'} onClick={togglePause}><Icon name={playing ? 'pause' : 'play'}/></button></div>
    </>}
    {mode === 'setup' && <form className="intro-setup" onSubmit={onSubmit}><div className="intro-setup-layout"><section className="intro-welcome"><div className="intro-eyebrow">LIFE SIMULATOR</div><h1>Một đời<br/>để sống.</h1><p>Có những chuyến đi<br/>là khởi đầu của cả một cuộc đời.</p><div className="intro-route"><span>Quê nhà</span><i/><span>An Nhiên</span></div><p className="intro-chapter">CHƯƠNG ĐẦU TIÊN<br/>Một chiếc vé. Một cuộc đời đang chờ.</p></section><section className="intro-passport" aria-labelledby="introPassportTitle"><h2 id="introPassportTitle">Bắt đầu hành trình</h2><label htmlFor="introName">TÊN NHÂN VẬT</label><div className="intro-name-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><input id="introName" value={name} onChange={e => setName(e.target.value)} placeholder="Bạn muốn được gọi là…" maxLength={32} autoComplete="off" required/></div><span className="intro-choice-label" id="introGenderLabel">CHỌN NHÂN VẬT</span><div className="intro-choices" role="group" aria-labelledby="introGenderLabel">{(['male', 'female'] as const).map(value => <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)}><img src={shotURL('05_seated', value)} alt="" draggable={false}/><span>{value === 'male' ? 'Chàng trai' : 'Cô gái'}<i aria-hidden="true">✓</i></span></button>)}</div><button className="intro-primary" type="submit"><span>BẮT ĐẦU HÀNH TRÌNH</span><Icon name="arrow"/></button>{canResume && <><button className="intro-secondary" type="button" disabled={!initialMapReady} onClick={resume}>TIẾP TỤC GAME ĐANG CHƠI</button>{mapStatus}</>}</section></div></form>}
    {mode === 'end' && <section className="intro-end"><div className="intro-eyebrow">CHƯƠNG 01 · NGÀY ĐẦU TIÊN</div><div className="intro-ornament"/><h1>Một nơi xa lạ.<br/>Một khởi đầu mới.</h1><p>{name.trim() || profile?.name || 'Bạn'}, thành phố đang thức giấc. Việc đầu tiên: tìm một nơi để ở.</p><div className="intro-endbuttons">{!initialMapReady&&<p className="intro-entry-notice" role="status">Đang chuẩn bị khu phố đầu tiên…</p>}<button type="button" className="intro-primary" disabled={!initialMapReady} onClick={finish}>BƯỚC VÀO THÀNH PHỐ</button>{mapStatus}<button type="button" className="intro-secondary" onClick={start}>Xem lại đoạn mở đầu</button></div></section>}
    {SOUND_KEYS.map(key => <audio key={key} ref={element => { if (element) audio.current[key] = element; }} src={`intro/audio/${SOUND_FILES[key]}`} preload="metadata" hidden data-sound={key} onEnded={() => activeSounds.current.delete(key)}/>)}
  </section>;
}
