let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playPop() {
  try {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  } catch {}
}

export function playSuccess() {
  try {
    const c = getCtx();
    if (!c) return;
    [523, 659, 784].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.12, c.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.2);
      osc.start(c.currentTime + i * 0.12);
      osc.stop(c.currentTime + i * 0.12 + 0.2);
    });
  } catch {}
}

export function playClick() {
  try {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(1200, c.currentTime);
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.03);
  } catch {}
}
