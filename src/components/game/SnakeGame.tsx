"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine } from './SnakeEngine';
import { GameState, GRID_SIZE, CELL_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED, Direction } from './types';
import { sounds } from '@/lib/sounds';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SnakeEngine>(new SnakeEngine());
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [foodPulse, setFoodPulse] = useState(1);
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

  const draw = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    const engine = engineRef.current;
    const size = GRID_SIZE * CELL_SIZE;

    // Clear background
    ctx.clearRect(0, 0, size, size);

    // Draw Subtle Grid
    ctx.strokeStyle = '#33FF9922';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(size, i * CELL_SIZE);
      ctx.stroke();
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
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    engine.snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#FF3366' : '#FF3366DD';
      ctx.shadowBlur = isHead ? 20 : 5;
      ctx.shadowColor = '#FF3366';
      
      const padding = 2;
      const r = isHead ? 6 : 4;
      
      // Rounded rectangles for segments
      const x = segment.x * CELL_SIZE + padding;
      const y = segment.y * CELL_SIZE + padding;
      const w = CELL_SIZE - padding * 2;
      const h = CELL_SIZE - padding * 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 select-none relative z-10">
      {/* HUD */}
      <div className="w-full max-w-[400px] flex justify-between items-center mb-6 px-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Score</span>
          <span className="text-3xl font-bold neon-text-red font-headline">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            <Trophy className="w-3 h-3" />
            <span>Best</span>
          </div>
          <span className="text-3xl font-bold neon-text-yellow font-headline">{highScore}</span>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="relative p-1 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="rounded-lg bg-black/40 backdrop-blur-sm"
        />

        {/* Overlays */}
        {gameState === 'START' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg animate-in fade-in zoom-in duration-300">
            <h1 className="text-5xl font-bold mb-2 neon-text-red italic tracking-tighter">NEON</h1>
            <h1 className="text-5xl font-bold mb-8 neon-text-green italic tracking-tighter">SERPENT</h1>
            <Button 
              size="lg" 
              onClick={resetGame}
              className="px-8 py-6 text-xl rounded-full bg-primary hover:bg-primary/80 neon-shadow animate-pulse"
            >
              <Play className="mr-2 h-6 w-6 fill-current" /> START GAME
            </Button>
            <p className="mt-8 text-xs text-muted-foreground tracking-widest uppercase opacity-60">Use Arrow Keys or WASD</p>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg animate-game-over-pop">
            <h2 className="text-3xl font-bold text-destructive mb-2 uppercase tracking-widest">System Failure</h2>
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-sm uppercase mb-1">Final Score</p>
              <p className="text-6xl font-bold neon-text-red font-headline">{score}</p>
            </div>
            <Button 
              size="lg" 
              variant="outline"
              onClick={resetGame}
              className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-6 text-xl rounded-full"
            >
              <RotateCcw className="mr-2 h-6 w-6" /> REBOOT
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-3 mt-10 md:hidden">
        <div />
        <Button 
          variant="outline" 
          size="icon" 
          className="h-14 w-14 rounded-full bg-white/5 border-white/20"
          onPointerDown={() => engineRef.current.setDirection('UP')}
        >
          <ArrowUp className="w-8 h-8" />
        </Button>
        <div />
        <Button 
          variant="outline" 
          size="icon" 
          className="h-14 w-14 rounded-full bg-white/5 border-white/20"
          onPointerDown={() => engineRef.current.setDirection('LEFT')}
        >
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-14 w-14 rounded-full bg-white/5 border-white/20"
          onPointerDown={() => engineRef.current.setDirection('DOWN')}
        >
          <ArrowDown className="w-8 h-8" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-14 w-14 rounded-full bg-white/5 border-white/20"
          onPointerDown={() => engineRef.current.setDirection('RIGHT')}
        >
          <ArrowRight className="w-8 h-8" />
        </Button>
      </div>

      <footer className="mt-12 text-[10px] text-muted-foreground uppercase tracking-[0.4em] opacity-40">
        &copy; 2024 NEON SERPENT ARCADE
      </footer>
    </div>
  );
}
