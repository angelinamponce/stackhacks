import { useRef, useEffect } from "react";

export default function Constellation() {
  const ref = useRef(null);

  useEffect(() => {
    const cvs = ref.current;
    const ctx = cvs.getContext("2d");

    // Quiet background: about half the nodes, ~35-40% of the old opacity, slow drift, no node halos
    const CFG = {
      nodes: 31,
      connectDist: 190,
      nodeR: 2.6,
      speed: 0.12,
      mouseR: 230,
      mouseForce: 0.012,
      wobble: 0.006,
      lineAlpha: 0.2,
      nodeAlpha: 0.35,
      mouseAlpha: 0.14,
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const C = {
      n: [226, 188, 114],
      g: [198, 161, 91],
      e: [198, 161, 91],
      m: [237, 232, 217],
    };
    const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

    let W,
      H,
      nodes = [],
      mouse = { x: -9999, y: -9999 },
      t = 0;

    const resize = () => {
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
    };

    const mkNode = () => {
      const a = Math.random() * Math.PI * 2;
      const s = CFG.speed * (0.2 + Math.random() * 0.8);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: CFG.nodeR * (0.6 + Math.random() * 0.9),
        wAx: 0.006 + Math.random() * 0.01,
        wAy: 0.006 + Math.random() * 0.01,
        wFx: 0.003 + Math.random() * 0.005,
        wFy: 0.003 + Math.random() * 0.005,
        wPx: Math.random() * Math.PI * 2,
        wPy: Math.random() * Math.PI * 2,
      };
    };

    const init = () => {
      nodes = Array.from({ length: CFG.nodes }, mkNode);
    };

    // Fade the network out behind content marked [data-network-clear] (the hero's text column):
    // a hard cut just around the box so no dot or line crosses it, then a soft feathered edge.
    const clearZones = () => {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      for (const el of document.querySelectorAll("[data-network-clear]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > H || !r.width) continue;
        for (let k = 6; k >= 0; k--) {
          const pad = 16 + k * 14;
          ctx.fillStyle = `rgba(0,0,0,${k === 0 ? 1 : 0.2})`;
          ctx.beginPath();
          ctx.roundRect(r.left - pad, r.top - pad, r.width + pad * 2, r.height + pad * 2, 24 + k * 10);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    let raf = 0;
    const frame = () => {
      if (!reduceMotion) raf = requestAnimationFrame(frame);
      t++;
      ctx.clearRect(0, 0, W, H);

      for (const n of reduceMotion ? [] : nodes) {
        n.vx += Math.sin(t * n.wFx + n.wPx) * n.wAx * CFG.wobble;
        n.vy += Math.cos(t * n.wFy + n.wPy) * n.wAy * CFG.wobble;
        const dx = mouse.x - n.x,
          dy = mouse.y - n.y,
          d = Math.hypot(dx, dy);
        if (d < CFG.mouseR && d > 1) {
          const f = (1 - d / CFG.mouseR) * CFG.mouseForce;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
        const spd = Math.hypot(n.vx, n.vy);
        if (spd > CFG.speed) {
          n.vx = (n.vx / spd) * CFG.speed;
          n.vy = (n.vy / spd) * CFG.speed;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }

      ctx.lineWidth = 0.65;
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CFG.connectDist) {
            const alpha = Math.pow(1 - dist / CFG.connectDist, 1.4) * CFG.lineAlpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = rgba(C.e, alpha);
            ctx.stroke();
          }
        }

      if (mouse.x > -100) {
        ctx.lineWidth = 0.55;
        for (const n of nodes) {
          const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (dist < CFG.mouseR) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = rgba(C.m, (1 - dist / CFG.mouseR) * CFG.mouseAlpha);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(C.n, CFG.nodeAlpha);
        ctx.fill();
      }

      if (mouse.x > -100) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = rgba(C.m, 0.35);
        ctx.fill();
      }

      clearZones();
    };

    const onResize = () => {
      resize();
      init();
      if (reduceMotion) frame();
    };
    // Reduced motion: a static network, redrawn only when the page scrolls (so the clear zone follows the text)
    const onScroll = () => { if (reduceMotion) frame(); };
    const onMove = (e) => {
      if (reduceMotion) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    resize();
    init();
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas id="constellation-canvas" ref={ref} style={{ position: "fixed", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }} />;

}