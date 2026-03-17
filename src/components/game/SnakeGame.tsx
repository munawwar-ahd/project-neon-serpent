"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine } from './SnakeEngine';
import { GameState, GRID_SIZE, CELL_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED } from './types';
import { sounds } from '@/lib/sounds';
import { Trophy, Play, Pause, RotateCcw, Maximize, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export default function SnakeGame() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SnakeEngine>(new SnakeEngine());
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const frameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_SPEED);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('neon-serpent-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const saveHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem('neon-serpent-highscore', currentScore.toString());
    }
  }, [highScore]);

  const resetGame = () => {
    engineRef.current.reset();
    setScore(0);
    speedRef.current = INITIAL_SPEED;
    setGameState('PLAYING');
    lastUpdateRef.current = performance.now();
  };

  const togglePause = () => {
    if (gameState === 'PLAYING') setGameState('PAUSED');
    else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      lastUpdateRef.current = performance.now();
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'p') {
      togglePause();
      return;
    }

    if (gameState !== 'PLAYING') return;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': engineRef.current.setDirection('UP'); break;
      case 'ArrowDown': case 's': case 'S': engineRef.current.setDirection('DOWN'); break;
      case 'ArrowLeft': case 'a': case 'A': engineRef.current.setDirection('LEFT'); break;
      case 'ArrowRight': case 'd': case 'D': engineRef.current.setDirection('RIGHT'); break;
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Fullscreen failed: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Neon Serpent Arcade',
      text: 'Check out this neon snake game!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Share the fun!" });
      }
    } catch (err) {
      console.warn("Share failed", err);
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    const engine = engineRef.current;
    const size = GRID_SIZE * CELL_SIZE;
    ctx.clearRect(0, 0, size, size);

    // Draw Subtle Grid
    ctx.strokeStyle = 'rgba(51, 255, 153, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, size); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(size, i * CELL_SIZE); ctx.stroke();
    }

    // Draw Food
    const pulse = 1 + Math.sin(timestamp / 200) * 0.15;
    ctx.fillStyle = '#FFFF33';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFFF33';
    ctx.beginPath();
    ctx.arc(
      engine.food.x * CELL_SIZE + CELL_SIZE / 2,
      engine.food.y * CELL_SIZE + CELL_SIZE / 2,
      (CELL_SIZE / 2.5) * pulse,
      0, Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    engine.snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#FF3366' : '#FF3366DD';
      ctx.shadowBlur = isHead ? 20 : 5;
      ctx.shadowColor = '#FF3366';
      ctx.beginPath();
      ctx.roundRect(
        segment.x * CELL_SIZE + 2, 
        segment.y * CELL_SIZE + 2, 
        CELL_SIZE - 4, 
        CELL_SIZE - 4, 
        isHead ? 6 : 4
      );
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState === 'PLAYING') {
      const elapsed = timestamp - lastUpdateRef.current;
      if (elapsed > speedRef.current) {
        const eaten = engineRef.current.update();
        if (eaten) {
          setScore(engineRef.current.score);
          sounds?.playEat();
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
          speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
        }
        if (engineRef.current.isGameOver) {
          setGameState('GAMEOVER');
          sounds?.playGameOver();
          saveHighScore(engineRef.current.score);
        }
        lastUpdateRef.current = timestamp;
      }
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, timestamp);
    }
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, saveHighScore]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 select-none relative z-10 overflow-hidden pb-40">
      {/* Utility Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full bg-white/5 border border-white/10 text-white/60">
          <Maximize className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full bg-white/5 border border-white/10 text-white/60">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* HUD */}
      <div className="w-full max-w-[400px] flex justify-between items-center mb-6 px-4 bg-black/20 backdrop-blur-md rounded-2xl py-3 border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Score</span>
          <span className="text-3xl font-black neon-text-red tabular-nums">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <Trophy className="w-3 h-3 text-secondary" />
            <span>Best</span>
          </div>
          <span className="text-3xl font-black neon-text-yellow tabular-nums">{highScore}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="rounded-xl bg-black/60 backdrop-blur-xl max-w-full h-auto border border-white/10"
        />

        {/* Overlays */}
        {gameState === 'START' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl backdrop-blur-sm">
            <h1 className="text-5xl font-black italic tracking-tighter mb-8 text-center">
              <span className="neon-text-red block">NEON</span>
              <span className="neon-text-green block">SERPENT</span>
            </h1>
            <Button size="lg" onClick={resetGame} className="px-10 py-7 text-xl rounded-full bg-primary neon-shadow">
              <Play className="mr-2 h-6 w-6" /> START
            </Button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
            <h2 className="text-4xl font-black neon-text-yellow mb-6">PAUSED</h2>
            <Button size="lg" onClick={togglePause} className="px-10 py-7 rounded-full bg-white/10 text-white border border-white/20">
              <Play className="mr-2 h-6 w-6" /> RESUME
            </Button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 rounded-xl backdrop-blur-md">
            <h2 className="text-4xl font-black text-destructive mb-6 italic">GAME OVER</h2>
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Final Score</p>
              <p className="text-6xl font-black neon-text-red">{score}</p>
            </div>
            <Button size="lg" variant="outline" onClick={resetGame} className="border-primary/50 text-primary hover:bg-primary px-10 py-7 rounded-full">
              <RotateCcw className="mr-2 h-6 w-6" /> RETRY
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Controls (Required D-pad Structure) */}
      <div className="mobile-controls">
        <button id="up" onTouchStart={(e) => { e.preventDefault(); engineRef.current.setDirection('UP'); }}>▲</button>
        <div className="middle-row">
          <button id="left" onTouchStart={(e) => { e.preventDefault(); engineRef.current.setDirection('LEFT'); }}>◀</button>
          <button id="right" onTouchStart={(e) => { e.preventDefault(); engineRef.current.setDirection('RIGHT'); }}>▶</button>
        </div>
        <button id="down" onTouchStart={(e) => { e.preventDefault(); engineRef.current.setDirection('DOWN'); }}>▼</button>
      </div>

      <footer className="mt-8 text-[9px] text-muted-foreground uppercase tracking-[0.5em] font-bold opacity-30 text-center">
        <span>&copy; 2024 NEON SERPENT</span><br/>
        <span>CRAFTED BY <span className="neon-text-red font-black">MUNAWWAR</span></span>
      </footer>
    </div>
  );
}
