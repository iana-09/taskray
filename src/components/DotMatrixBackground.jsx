import { useEffect, useRef } from 'react';

function DotMatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;

    const TOTAL_SIZE = 22;
    const DOT_RADIUS = 1.2;  // smaller = more subtle

    const OPACITIES = [0.15, 0.15, 0.2, 0.25, 0.25, 0.3, 0.35, 0.35, 0.4, 0.5];

    const COLORS = [
      [59,  130, 246],
      [99,  102, 241],
      [79,  70,  229],
      [147, 197, 253],
      [59,  130, 246],
      [99,  102, 241],
    ];

    const ANIM_SPEED = 0.5; // how fast the sweep travels outward

    let dots = [];

    const seededRand = (x, y) => {
      const val = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return val - Math.floor(val);
    };

    const buildDots = () => {
      dots = [];
      const w = canvas.width;
      const h = canvas.height;
      const offsetX = Math.abs(Math.floor(((w % TOTAL_SIZE) - DOT_RADIUS * 2) * 0.5));
      const offsetY = Math.abs(Math.floor(((h % TOTAL_SIZE) - DOT_RADIUS * 2) * 0.5));
      const cols = Math.ceil(w / TOTAL_SIZE) + 2;
      const rows = Math.ceil(h / TOTAL_SIZE) + 2;
      const cx = w / 2 / TOTAL_SIZE;
      const cy = h / 2 / TOTAL_SIZE;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const showOffset  = seededRand(c, r);
          const colorIdx    = Math.floor(showOffset * COLORS.length);
          const opacityIdx  = Math.min(Math.floor(seededRand(c + 0.5, r + 0.5) * 10), 9);
          const dist        = Math.hypot(c - cx, r - cy);
          const introOffset = dist * 0.01 + showOffset * 0.15;

          dots.push({
            x: c * TOTAL_SIZE - offsetX,
            y: r * TOTAL_SIZE - offsetY,
            color:        COLORS[colorIdx],
            baseOpacity:  OPACITIES[opacityIdx],
            introOffset,
            flickerPhase: seededRand(c * 3.7, r * 2.3) * Math.PI * 2,
            flickerSpeed: 0.3 + seededRand(c * 1.1, r * 4.9) * 0.5,
          });
        }
      }
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildDots();
    };

    resize();
    window.addEventListener('resize', resize);

    // Use performance.now() directly so time always moves forward
    // regardless of when component mounts — this fixes the "not moving" bug
    const mountTime = performance.now();

    const draw = () => {
      const t = (performance.now() - mountTime) / 1000; // seconds since mount

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        // Smooth fade-in over 0.4s once the sweep front reaches this dot
        const elapsed  = t * ANIM_SPEED - dot.introOffset;
        const fadeIn   = Math.min(1, Math.max(0, elapsed / 0.4));
        if (fadeIn === 0) continue;

        // Slow continuous flicker
        const flicker  = 0.55 + 0.45 * Math.sin(t * dot.flickerSpeed + dot.flickerPhase);
        const opacity  = fadeIn * dot.baseOpacity * flicker;

        const [r, g, b] = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 30% 40%, #0f0c29 0%, #1a1040 40%, #0d0d1a 100%)',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 55% at 85% 15%, rgba(59,130,246,0.18) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 50% at 15% 90%, rgba(139,92,246,0.2) 0%, transparent 70%)',
      }} />
    </div>
  );
}

export default DotMatrixBackground;