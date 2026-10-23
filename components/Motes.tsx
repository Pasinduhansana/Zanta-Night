"use client";

import { useEffect, useRef } from "react";

type Mote = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  alpha: number;
  phase: number;
  speed: number;
  hue: 0 | 1;
};

export default function Motes({ className = "", count = 44 }: { className?: string; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let motes: Mote[] = [];

    const seed = () => {
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.7,
        vy: 0.12 + Math.random() * 0.42,
        vx: (Math.random() - 0.5) * 0.16,
        alpha: 0.15 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.02,
        hue: Math.random() > 0.72 ? 1 : 0,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.phase += m.speed * dt;
        m.y -= m.vy * dt;
        m.x += (m.vx + Math.sin(m.phase) * 0.18) * dt;
        if (m.y < -8) {
          m.y = height + 8;
          m.x = Math.random() * width;
        }
        if (m.x < -8) m.x = width + 8;
        if (m.x > width + 8) m.x = -8;
        const twinkle = 0.55 + Math.sin(m.phase * 1.6) * 0.45;
        ctx.beginPath();
        ctx.fillStyle =
          m.hue === 1
            ? `rgba(57, 255, 20, ${m.alpha * twinkle * 0.8})`
            : `rgba(182, 255, 0, ${m.alpha * twinkle})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = m.hue === 1 ? "rgba(57,255,20,0.65)" : "rgba(182,255,0,0.65)";
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    resize();

    if (reduce) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVisible = () => {
      if (!document.hidden && !reduce) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [count]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />;
}
