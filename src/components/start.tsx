import { useRef, useEffect } from 'react';

// 流星动画类型定义
interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  size: number;
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meteorsRef = useRef<Meteor[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createMeteor = (): Meteor => ({
      x: Math.random() * canvas.width,
      y: 0,
      length: Math.random() * 80 + 20,
      speed: Math.random() * 2 + 5,
      size: Math.random() * 2 + 0.5
    });

    const initMeteors = () => {
      meteorsRef.current = Array(20).fill(null).map(createMeteor);
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      meteorsRef.current.forEach((meteor, index) => {
        ctx.beginPath();
        ctx.lineWidth = meteor.size;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x + meteor.length, meteor.y + meteor.length);
        ctx.stroke();

        meteor.x += meteor.speed;
        meteor.y += meteor.speed;

        if (meteor.x > canvas.width || meteor.y > canvas.height) {
          meteorsRef.current[index] = createMeteor();
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initMeteors();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none bg-black"
      style={{ zIndex: 0 }}
    />
  );
}
