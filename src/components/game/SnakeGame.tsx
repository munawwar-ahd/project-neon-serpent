"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine } from './SnakeEngine';
import { GameState, GRID_SIZE, CELL_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED } from './types';
import { sounds } from '@/lib/sounds';
import { Trophy, Play, Pause, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

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
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Neon Serpent Arcade',
      text: 'Can you beat my score in Neon Serpent?',
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Game link copied to clipboard for sharing.",
      });
    } catch (clipboardErr) {
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: "Could not share or copy the link.",
      });
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
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }
          speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
        }
        
        if (engineRef.current.isGameOver) {
          setGameState('GAMEOVER');
          sounds?.playGameOver();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 select-none relative z-10 overflow-hidden">
      {/* Utility Bar */}
      <div className="absolute top-4 right-4 flex gap-2">
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <Button variant="ghost" size="icon" onClick={togglePause} className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60">
            {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60">
          <Maximize className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* HUD */}
      <div className="w-full max-w-[400px] flex justify-between items-center mb-6 px-4 bg-black/20 backdrop-blur-md rounded-2xl py-3 border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Score</span>
          <span className="text-3xl font-black neon-text-red tabular-nums">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            <Trophy className="w-3 h-3 text-secondary" />
            <span>Best</span>
          </div>
          <span className="text-3xl font-black neon-text-yellow tabular-nums">{highScore}</span>
        </div>
      </div>

      {/* Game Canvas Area */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-[2rem] blur-2xl opacity-50" />
        <div className="relative p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="rounded-xl bg-black/60 backdrop-blur-xl max-w-full h-auto"
          />

          {/* Overlays */}
          {gameState === 'START' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <h1 className="text-6xl font-black italic tracking-tighter leading-none mb-2">
                  <span className="neon-text-red block">NEON</span>
                  <span className="neon-text-green block translate-x-2">SERPENT</span>
                </h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.5em] font-bold uppercase opacity-50">Browser Arcade v1.0</p>
              </div>
              
              <Button 
                size="lg" 
                onClick={resetGame}
                className="group relative px-10 py-7 text-xl rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 neon-shadow"
              >
                <Play className="mr-2 h-6 w-6 fill-current" /> 
                <span className="font-bold tracking-widest uppercase">Start Game</span>
              </Button>
            </div>
          )}

          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
              <h2 className="text-4xl font-black neon-text-yellow mb-6 uppercase italic tracking-tighter">PAUSED</h2>
              <Button 
                size="lg" 
                onClick={togglePause}
                className="px-10 py-7 text-xl rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <Play className="mr-2 h-6 w-6 fill-current" /> RESUME
              </Button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 rounded-xl animate-game-over-pop backdrop-blur-md">
              <span className="text-xs font-bold text-destructive/80 uppercase tracking-[0.5em] mb-2">System Failure</span>
              <h2 className="text-4xl font-black text-destructive mb-6 uppercase italic tracking-tighter">GAME OVER</h2>
              <div className="text-center mb-8 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 min-w-[160px]">
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Final Score</p>
                <p className="text-6xl font-black neon-text-red tabular-nums">{score}</p>
              </div>
              <Button 
                size="lg" 
                variant="outline"
                onClick={resetGame}
                className="border-primary/50 text-primary hover:bg-primary hover:text-white px-10 py-7 text-xl rounded-full transition-all duration-300 active:scale-95"
              >
                <RotateCcw className="mr-2 h-6 w-6" /> RETRY
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Controller */}
      <div className="md:hidden mt-8 flex flex-col items-center touch-none">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 p-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
          {/* Row 1 */}
          <div />
          <Button 
            variant="outline" 
            className="h-16 w-16 rounded-2xl bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all active:scale-90 shadow-lg"
            onPointerDown={(e) => { e.preventDefault(); engineRef.current.setDirection('UP'); }}
          >
            <ArrowUp className="w-8 h-8 text-primary" />
          </Button>
          <div />
          
          {/* Row 2 */}
          <Button 
            variant="outline" 
            className="h-16 w-16 rounded-2xl bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all active:scale-90 shadow-lg"
            onPointerDown={(e) => { e.preventDefault(); engineRef.current.setDirection('LEFT'); }}
          >
            <ArrowLeft className="w-8 h-8 text-primary" />
          </Button>
          <Button 
            variant="outline" 
            className="h-16 w-16 rounded-full bg-white/5 border-white/20 hover:bg-white/10 transition-all active:scale-90"
            onPointerDown={(e) => { e.preventDefault(); togglePause(); }}
          >
             {gameState === 'PAUSED' ? <Play className="w-6 h-6 text-white/40" /> : <Pause className="w-6 h-6 text-white/40" />}
          </Button>
          <Button 
            variant="outline" 
            className="h-16 w-16 rounded-2xl bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all active:scale-90 shadow-lg"
            onPointerDown={(e) => { e.preventDefault(); engineRef.current.setDirection('RIGHT'); }}
          >
            <ArrowRight className="w-8 h-8 text-primary" />
          </Button>
          
          {/* Row 3 */}
          <div />
          <Button 
            variant="outline" 
            className="h-16 w-16 rounded-2xl bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all active:scale-90 shadow-lg"
            onPointerDown={(e) => { e.preventDefault(); engineRef.current.setDirection('DOWN'); }}
          >
            <ArrowDown className="w-8 h-8 text-primary" />
          </Button>
          <div />
        </div>
      </div>

      {/* Desktop Hint */}
      <div className="hidden md:block mt-8 text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">
        WASD to Move &bull; P to Pause
      </div>

      <footer className="mt-auto pt-8 pb-4 flex flex-col items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-[0.5em] font-bold opacity-30">
        <span>&copy; 2024 NEON SERPENT</span>
        <span className="opacity-100">CRAFTED BY <span className="neon-text-red font-black">MUNAWWAR</span></span>
      </footer>
    </div>
  );
}
