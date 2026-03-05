'use client';

import { useEffect, useRef } from 'react';

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cols: number;
    let drops: number[];

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF'.split('');
    const fontSize = 13;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      cols = Math.floor(canvas!.width / fontSize);
      drops = Array(cols).fill(1);
    }

    function draw() {
      ctx!.fillStyle = 'rgba(1, 2, 8, 0.05)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.font = `${fontSize}px JetBrains Mono, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const opacity = Math.random() * 0.6 + 0.1;

        // Alternate between cyan and green tones
        if (i % 3 === 0) {
          ctx!.fillStyle = `rgba(0, 245, 255, ${opacity * 0.4})`;
        } else if (i % 3 === 1) {
          ctx!.fillStyle = `rgba(0, 255, 136, ${opacity * 0.35})`;
        } else {
          ctx!.fillStyle = `rgba(0, 128, 255, ${opacity * 0.3})`;
        }

        ctx!.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none',
      }}
    />
  );
}
