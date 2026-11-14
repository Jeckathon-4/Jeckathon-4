// 화면별 BGM: Web Audio로 직접 합성 (음원 파일·저작권 없음).
// 사용: BGM.play('pray' | 'loss' | 'win' | 'draw' | null). 브라우저 정책상 첫 터치 후 소리가 납니다.
(function () {
  let ctx, master, current = null, want = null, stopFns = [], muted = false;
  try { muted = localStorage.getItem('bira-bgm-muted') === '1'; } catch {}
  const VOL = 0.22;
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : VOL;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    return ctx;
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function tone(freq, t, dur, { type = 'sine', vol = 0.2, attack = 0.02, release = 0.3, dest = master, detune = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseBuffer() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b;
  }
  function rainBed(bus, vol) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(bus); src.start();
    return () => src.stop();
  }
  function hit(t, { freq = 60, vol = 0.6, dur = 0.25, bus } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(freq * 2.5, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur);
  }
  function hat(t, bus, vol = 0.08) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer();
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + 0.06);
  }
  // 스케줄러: bar 단위로 미리 예약
  function loop(barSec, scheduleBar, bus) {
    let next = ctx.currentTime + 0.1, bar = 0, alive = true;
    const tick = () => { if (!alive) return; while (next < ctx.currentTime + 1.5) { scheduleBar(next, bar++, bus); next += barSec; } };
    tick(); const id = setInterval(tick, 300);
    return () => { alive = false; clearInterval(id); };
  }
  const TRACKS = {
    // 기도관: 빗소리 + 낮은 단조 패드 + 느린 심장박동
    pray(bus) {
      const stopRain = rainBed(bus, 0.05);
      const chords = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]];
      const stopLoop = loop(4, (t, i, b) => {
        chords[i % 4].forEach((n, k) => tone(midi(n), t, 4.2, { type: k ? 'triangle' : 'sine', vol: k ? 0.05 : 0.09, attack: 1.2, release: 1.5, dest: b }));
        [0, 0.28, 2, 2.28].forEach((d, k) => hit(t + d, { freq: 48, vol: k % 2 ? 0.25 : 0.4, dur: 0.3, bus: b }));
        if (i % 2) tone(midi(69 + [0, 3, 7, 5][i % 4]), t + 1, 1.6, { type: 'sine', vol: 0.04, attack: 0.3, release: 0.8, dest: b });
      }, bus);
      return () => { stopRain(); stopLoop(); };
    },
    // 패배 추모관: 느린 오르간 단조 진행 + 종소리
    loss(bus) {
      const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]];
      return loop(5, (t, i, b) => {
        prog[i % 4].forEach((n) => { tone(midi(n), t, 5.2, { type: 'triangle', vol: 0.07, attack: 0.8, release: 1.6, dest: b }); tone(midi(n + 12), t, 5.2, { type: 'sine', vol: 0.025, attack: 1, release: 1.6, dest: b, detune: 6 }); });
        tone(midi(prog[i % 4][0] - 12), t, 5.2, { type: 'sine', vol: 0.1, attack: 0.5, release: 1.5, dest: b });
        if (i % 2 === 0) tone(midi(81), t + 0.2, 3, { type: 'sine', vol: 0.05, attack: 0.005, release: 2.8, dest: b });
      }, bus);
    },
    // 승리 클럽: 124bpm 포온더플로어 + 베이스 + 신스 스탭
    win(bus) {
      const beat = 60 / 124, roots = [45, 45, 41, 43];
      return loop(beat * 4, (t, i, b) => {
        for (let k = 0; k < 4; k++) { hit(t + k * beat, { freq: 52, vol: 0.7, dur: 0.22, bus: b }); hat(t + k * beat + beat / 2, b); }
        const r = roots[i % 4];
        [0, 0.75, 1.5, 2.5, 3.25].forEach((d) => tone(midi(r - 12), t + d * beat, beat * 0.45, { type: 'sawtooth', vol: 0.06, attack: 0.005, release: 0.1, dest: b }));
        [1, 3].forEach((d) => [0, 4, 7].forEach((iv) => tone(midi(r + 12 + iv), t + d * beat, beat * 0.3, { type: 'square', vol: 0.025, attack: 0.005, release: 0.08, dest: b })));
      }, bus);
    },
    // 무승부 막차 승강장: 역 안내 차임 + 형광등 웅웅거림
    draw(bus) {
      const hum = ctx.createOscillator(), hg = ctx.createGain(); hum.frequency.value = 60; hg.gain.value = 0.02; hum.connect(hg); hg.connect(bus); hum.start();
      const stopLoop = loop(8, (t, i, b) => {
        [64, 60, 62, 55].forEach((n, k) => tone(midi(n + 12), t + k * 0.55, 1.6, { type: 'sine', vol: 0.06, attack: 0.005, release: 1.4, dest: b }));
        [52, 55, 50].forEach((n, k) => tone(midi(n), t + 3 + k * 1.2, 2.4, { type: 'triangle', vol: 0.035, attack: 0.4, release: 1, dest: b }));
      }, bus);
      return () => { hum.stop(); stopLoop(); };
    },
  };
  function start(name) {
    stopFns.forEach((f) => f()); stopFns = [];
    current = name; if (!name || !TRACKS[name] || !ensure()) return;
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5); bus.connect(master);
    const stop = TRACKS[name](bus);
    stopFns.push(() => { const t = ctx.currentTime; bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + 0.8); setTimeout(() => { stop(); bus.disconnect(); }, 900); });
  }
  function unlock() { if (!ensure()) return; if (ctx.state !== 'running') ctx.resume(); if (want !== current) start(want); }
  ['pointerdown', 'touchstart', 'keydown'].forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
  window.BGM = {
    play(name) { want = name || null; if (ctx && ctx.state === 'running') { if (want !== current) start(want); } else { try { ensure(); ctx.resume().then(() => { if (want !== current) start(want); }).catch(() => {}); } catch {} } },
    toggleMute() { muted = !muted; try { localStorage.setItem('bira-bgm-muted', muted ? '1' : '0'); } catch {} if (master) master.gain.value = muted ? 0 : VOL; return muted; },
    get muted() { return muted; },
  };
})();
