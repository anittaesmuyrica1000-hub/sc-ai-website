"use client";

import { useEffect } from "react";

/**
 * 입자 수렴 모션 — 점들이 강조 단어로 좁혀듦 (히어로 #real-word / CTA #real-cta 공용).
 * 원본 index.html 인라인 <script> 로직을 그대로 이식한다. 마운트 시 1회 실행.
 */
export default function HomeInteractive() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: Array<() => void> = [];

    function run(
      canvasId: string,
      targetId: string,
      colorFor: () => number[],
      maxA: number,
      glow: boolean
    ) {
      const c = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (!c || !c.getContext) return;
      const x = c.getContext("2d")!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const word = document.getElementById(targetId);
      let tx = 0,
        ty = 0,
        Rmax = 1;

      function aim() {
        if (!word) {
          tx = c!.width / 2;
          ty = c!.height * 0.44;
          return;
        }
        const cr = c!.getBoundingClientRect(),
          wr = word.getBoundingClientRect();
        tx = (wr.left + wr.width / 2 - cr.left) * dpr;
        ty = (wr.top + wr.height / 2 - cr.top) * dpr;
      }
      function size() {
        c!.width = c!.offsetWidth * dpr;
        c!.height = c!.offsetHeight * dpr;
        Rmax = Math.max(c!.width, c!.height) * 0.62;
        aim();
      }
      function spawn() {
        const a = Math.random() * 6.2832,
          R = Rmax * (0.85 + Math.random() * 0.55);
        return {
          x: tx + Math.cos(a) * R,
          y: ty + Math.sin(a) * R,
          sp: (1.4 + Math.random() * 1.9) * dpr,
          s: (0.6 + Math.random() * 1.0) * dpr,
          col: colorFor(),
        };
      }
      let P: ReturnType<typeof spawn>[] = [];
      function init() {
        P = [];
        for (let i = 0; i < 140; i++) {
          const p = spawn(),
            t = Math.random();
          p.x = tx + (p.x - tx) * t;
          p.y = ty + (p.y - ty) * t;
          P.push(p);
        }
      }
      size();
      init();
      window.addEventListener("resize", size);
      window.addEventListener("load", aim);

      let visible = false,
        running = false;
      function tick() {
        if (!visible) {
          running = false;
          return;
        } // 화면 밖이면 루프 정지(CPU·배터리 절약)
        aim();
        x.clearRect(0, 0, c!.width, c!.height);
        for (let i = 0; i < P.length; i++) {
          const p = P[i];
          let dx = tx - p.x,
            dy = ty - p.y,
            d = Math.hypot(dx, dy) || 1;
          if (d < 10) {
            const n = spawn();
            p.x = n.x;
            p.y = n.y;
            p.sp = n.sp;
            p.s = n.s;
            p.col = n.col;
            dx = tx - p.x;
            dy = ty - p.y;
            d = Math.hypot(dx, dy) || 1;
          }
          p.x += (dx / d) * p.sp;
          p.y += (dy / d) * p.sp;
          const alpha = Math.min(maxA, (d / (c!.height * 0.55)) * (maxA * 1.25));
          const rgb = p.col[0] + "," + p.col[1] + "," + p.col[2];
          if (glow) {
            x.shadowColor = "rgba(" + rgb + "," + alpha.toFixed(3) + ")";
            x.shadowBlur = p.s * 4;
          }
          x.fillStyle = "rgba(" + rgb + "," + alpha.toFixed(3) + ")";
          x.beginPath();
          x.arc(p.x, p.y, p.s, 0, 6.2832);
          x.fill();
        }
        if (glow) x.shadowBlur = 0;
        requestAnimationFrame(tick);
      }
      function start() {
        if (!running) {
          running = true;
          requestAnimationFrame(tick);
        }
      }
      // 화면(뷰포트)에 들어올 때만 애니메이션 — 캔버스가 보이지 않으면 멈춤
      let io: IntersectionObserver | null = null;
      if ("IntersectionObserver" in window) {
        io = new IntersectionObserver(
          function (es) {
            visible = es[0].isIntersecting;
            if (visible) start();
          },
          { rootMargin: "120px" }
        );
        io.observe(c);
      } else {
        visible = true;
        start();
      }

      cleanups.push(() => {
        window.removeEventListener("resize", size);
        window.removeEventListener("load", aim);
        if (io) io.disconnect();
        visible = false;
      });
    }

    // 히어로/CTA(다크): 입자 팔레트 — 청록·하늘색·파랑·보라 + 발광 글로우
    const STOPS = [
      [38, 208, 206],
      [143, 203, 255],
      [58, 111, 255],
      [150, 110, 255],
    ]; /* 청록→하늘색→파랑→보라 */
    function gradCol() {
      const t = Math.random() * (STOPS.length - 1),
        i = Math.floor(t),
        k = t - i,
        a = STOPS[i],
        b = STOPS[Math.min(i + 1, STOPS.length - 1)];
      return [
        Math.round(a[0] + (b[0] - a[0]) * k),
        Math.round(a[1] + (b[1] - a[1]) * k),
        Math.round(a[2] + (b[2] - a[2]) * k),
      ];
    }
    run("hero-particles", "real-word", gradCol, 0.9, true);
    run("final-particles", "real-cta", gradCol, 0.9, true);

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
