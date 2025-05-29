'use client';

import { useEffect, useRef, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

interface CyberBackgroundProps {
  title?: string;
  subtitle?: string;
  particleCount?: number;
  noiseIntensity?: number;
  particleSize?: { min: number; max: number };
  sakuraCount?: number;
  sakuraSpeed?: number; // 追加：桜の落ちるスピード倍率
  className?: string;
  children?: React.ReactNode;
}

interface WaveParticle {
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  amplitude: number;
  speed: number;
  freq: number;
}

// 桜花びらのパラメータ（index基準で決定。delayのみランダムで初期化）
const getPetalParams = (
  i: number,
  width: number,
  height: number,
  speed: number
) => {
  // 一斉に降るのを防ぐため delay を花びらごとにランダム（0〜2秒程度）にする
  const delay = Math.random() * 2;
  return {
    xStart: Math.sin(i * 0.8) * 0.3 * width + width * 0.5 + (i % 2 === 0 ? 80 : -100),
    xRange: Math.cos(i * 1.23) * 0.22 * width,
    yStart: -60 - (i % 5) * 30,
    yEnd: height + 60,
    rotate: (i % 2 === 0 ? 1 : -1) * (10 + i * 9),
    size: 24 + (i * 7) % 14,
    delay,
    duration: (2.7 + i * 0.17) / speed, // スピード倍率反映
    repeatDelay: 0.8 + (i % 3) * 0.23,
  };
};

export default function CyberBackground({
  title,
  subtitle,
  particleCount = 200,
  noiseIntensity = 0.0025,
  particleSize = { min: 0.5, max: 2.2 },
  sakuraCount = 10,
  sakuraSpeed = 1, // デフォルト値=1
  className,
  children,
}: CyberBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const particlesRef = useRef<WaveParticle[]>([]);

  // ウィンドウサイズ取得用
  const [size, setSize] = useState({ width: 1920, height: 1080 });
  useEffect(() => {
    function handleResize() {
      const el = bgRef.current;
      if (!el) return;
      setSize({ width: el.clientWidth, height: el.clientHeight });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    // パーティクルの初期化
    const W = canvas.width;
    const H = canvas.height;
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const baseX = Math.random() * W;
      return {
        baseX,
        baseY: (Math.random() - 0.5) * H * 0.25,
        size: Math.random() * (particleSize.max - particleSize.min) + particleSize.min,
        phase: Math.random() * Math.PI * 2,
        amplitude: 38 + Math.random() * 90,
        speed: 0.008 + Math.random() * 0.015,
        freq: 0.011 + Math.random() * 0.019,
      };
    });

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const midY = canvas.height / 2;

      // 背景ウェーブ
      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const freq = 0.0025 + l * 0.0014;
          const amp = 34 + l * 16;
          const y =
            midY +
            Math.sin(Date.now() * 0.00025 + x * freq + l * 2.4) * amp +
            Math.sin(Date.now() * 0.00038 + x * 0.007 + l * 2.7) * (amp / 2.2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          l === 0
            ? "rgba(165,243,252,0.08)"
            : l === 1
            ? "rgba(56,189,248,0.10)"
            : "rgba(59,130,246,0.13)";
        ctx.lineWidth = 1.8 - l * 0.3;
        ctx.stroke();
      }

      // パーティクルのウェーブ運動
      for (const p of particlesRef.current) {
        const now = Date.now();
        const x = (p.baseX + (now * p.speed * 60)) % canvas.width;
        const y =
          midY +
          p.baseY +
          Math.sin(now * p.speed + p.phase + x * p.freq) * p.amplitude +
          Math.sin(now * 0.0008 + x * 0.008 + p.phase) * p.amplitude * 0.25;

        const opacity = 0.11 + 0.13 * Math.abs(Math.cos(now * p.speed + p.phase));
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${opacity})`;
        ctx.shadowColor = "rgba(34,211,238,0.15)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      resizeCanvas();
      // リサイズ時にパーティクルを再初期化
      const W = canvas.width;
      const H = canvas.height;
      particlesRef.current = Array.from({ length: particleCount }, () => {
        const baseX = Math.random() * W;
        return {
          baseX,
          baseY: (Math.random() - 0.5) * H * 0.25,
          size: Math.random() * (particleSize.max - particleSize.min) + particleSize.min,
          phase: Math.random() * Math.PI * 2,
          amplitude: 38 + Math.random() * 90,
          speed: 0.008 + Math.random() * 0.015,
          freq: 0.011 + Math.random() * 0.019,
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, particleSize]);

  // 桜の花びらパラメータ（useMemoでdelay含めて計算）
  const petals = useMemo(() => {
    return Array.from({ length: sakuraCount }).map((_, i) =>
      getPetalParams(i, size.width, size.height, sakuraSpeed)
    );
    // sakuraSpeed も依存に入れる
  }, [sakuraCount, size, sakuraSpeed]);

  return (
    <div
      ref={bgRef}
      className={cn(
        "fixed inset-0 w-full h-full -z-10",
        "bg-gradient-to-br from-cyan-1200 via-sky-1000 to-blue-1200",
        className
      )}
    >
      {/* 月（背景） */}
      <div
        className="absolute left-1/2 top-[14%] -translate-x-1/2 pointer-events-none"
        style={{
          width: size.width * 0.22,
          height: size.width * 0.22,
          minWidth: 180,
          minHeight: 180,
          maxWidth: 380,
          maxHeight: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 60% 40%, #fffde4 75%, #fbc2eb33 100%, transparent 100%)",
          boxShadow:
            "0 0 140px 60px #fefefe70, 0 0 180px 100px #fbc2eb40",
          opacity: 0.14,
          zIndex: 2,
        }}
      />

      {/* 桜の花びら（上から下にランダムに降る） */}
      {petals.map((p, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            y: p.yStart,
            x: p.xStart,
            rotate: p.rotate
          }}
          animate={{
            opacity: [0, 0.7, 1, 0.7, 0],
            y: [p.yStart, (p.yStart + p.yEnd) / 2, p.yEnd],
            x: [
              p.xStart,
              p.xStart + (i % 2 === 0 ? -1 : 1) * p.xRange / 2,
              p.xStart + (i % 2 === 0 ? 1 : -1) * p.xRange,
            ],
            rotate: [
              p.rotate,
              p.rotate + (i % 2 === 0 ? 38 : -28),
              p.rotate + (i % 2 === 0 ? 58 : -44),
            ],
            transition: {
              delay: p.delay,
              duration: p.duration,
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: p.repeatDelay,
              ease: "easeInOut"
            }
          }}
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            zIndex: 5,
            width: p.size,
            height: p.size,
          }}
        >
          <svg viewBox="0 0 38 38" width={p.size} height={p.size}>
            <g>
              <path
                d="M19 6 Q22 13 19 18 Q16 13 19 6 Z"
                fill="#f9c4d2"
                fillOpacity={0.82}
              />
              <ellipse
                cx="19"
                cy="21"
                rx="6"
                ry="12"
                fill="#fdeff2"
                fillOpacity={0.96}
              />
            </g>
          </svg>
        </motion.div>
      ))}

      {/* 波・パーティクル・タイトル等 */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {(title || subtitle) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-4"
          >
            {title && (
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-pink-300 via-yellow-100 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xl md:text-2xl text-pink-100 font-medium">
                {subtitle}
              </p>
            )}
          </motion.div>
        </div>
      )}
      {children}
    </div>
  );
}
