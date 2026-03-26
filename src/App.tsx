/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
}

// --- Constants ---

const TRACKS: Track[] = [
  {
    id: 1,
    title: "ERR_0x00A1",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "MEM_LEAK_DETECTED",
    artist: "SYS_ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "NULL_POINTER_EXCEPTION",
    artist: "KERNEL_PANIC",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 80;

// --- Components ---

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setFood(generateFood(INITIAL_SNAKE));
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setGameStarted(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          handlePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPlaying]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const interval = setInterval(moveSnake, GAME_SPEED);
      return () => clearInterval(interval);
    }
  }, [moveSnake, gameStarted, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const cellSize = canvas.width / GRID_SIZE;
      
      // Clear with harsh black
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid (Harsh dotted)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.setLineDash([2, 2]);
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Food (Glitchy block)
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(food.x * cellSize + 4, food.y * cellSize + 4, cellSize - 8, cellSize - 8);

      // Draw Snake (Harsh blocks)
      snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#FFFFFF' : (index % 2 === 0 ? '#00FFFF' : '#FF00FF');
        ctx.fillRect(
          segment.x * cellSize + 1,
          segment.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      });
    };

    draw();
  }, [snake, food]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="static-noise"></div>
      <div className="scanline"></div>

      <header className="mb-8 text-center z-10 screen-tear">
        <h1 
          className="text-5xl md:text-7xl font-black tracking-widest mb-2 glitch-text"
          data-text="SYS.OP // SERPENT_PROTOCOL"
        >
          SYS.OP // SERPENT_PROTOCOL
        </h1>
        <p className="text-cyan-400 text-lg tracking-widest uppercase">
          INITIALIZING GLITCH.WAV ... STATUS: CORRUPT
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        
        {/* Left Sidebar: Stats */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="bg-black p-6 raw-border-cyan flex flex-col gap-2">
            <div className="text-cyan-400 mb-1 text-xl tracking-widest">
              {'>'} DATA_YIELD
            </div>
            <div className="text-5xl text-white">{score}</div>
          </div>

          <div className="bg-black p-6 raw-border-magenta flex flex-col gap-2">
            <div className="text-magenta-500 mb-1 text-xl tracking-widest">
              {'>'} PEAK_YIELD
            </div>
            <div className="text-5xl text-gray-300">{highScore}</div>
          </div>

          <div className="bg-black p-6 border-2 border-white/20">
            <h3 className="text-xl tracking-widest text-white mb-4">INPUT_VECTORS</h3>
            <div className="grid grid-cols-1 gap-4 text-lg text-gray-400">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-cyan-400">[ARROWS]</span>
                <span>NAVIGATE</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-magenta-500">[SPACE]</span>
                <span>AUDIO_HALT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Game Window */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative">
            <div className="relative bg-black raw-border-cyan p-2">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-full aspect-square max-w-[400px] cursor-none bg-black"
              />
              
              {!gameStarted && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center border-4 border-magenta-500 m-2">
                  {gameOver ? (
                    <>
                      <h2 className="text-5xl text-red-500 mb-4 glitch-text" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                      <p className="text-white mb-8 text-2xl">SYSTEM_HALT // YIELD: {score}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-5xl text-cyan-400 mb-4 glitch-text" data-text="AWAITING_INPUT">AWAITING_INPUT</h2>
                      <p className="text-white mb-8 text-xl">EXECUTE SEQUENCE TO COMMENCE</p>
                    </>
                  )}
                  <button 
                    onClick={resetGame}
                    className="px-8 py-4 bg-white text-black text-2xl hover:bg-cyan-400 hover:text-black transition-colors border-2 border-black hover:border-white"
                  >
                    {gameOver ? '[ REBOOT_SYSTEM ]' : '[ INITIATE ]'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Music Player */}
        <div className="lg:col-span-3 order-3">
          <div className="bg-black raw-border-magenta flex flex-col">
            <div className="p-6 pb-4 border-b-2 border-magenta-500/30">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl text-magenta-500">AUDIO_STREAM</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-4 bg-magenta-500 ${isPlaying ? 'animate-pulse' : 'opacity-30'}`} />
                  <div className={`w-2 h-6 bg-magenta-500 ${isPlaying ? 'animate-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.2s' }} />
                  <div className={`w-2 h-5 bg-magenta-500 ${isPlaying ? 'animate-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl text-white truncate mb-1">
                  {currentTrack.title}
                </h3>
                <p className="text-lg text-cyan-400">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 w-full bg-white/10 mb-8 border border-white/20">
                <div 
                  className="absolute top-0 left-0 h-full bg-magenta-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <button onClick={handlePrev} className="text-2xl text-gray-400 hover:text-cyan-400 transition-colors">
                  {'[<<]'}
                </button>
                <button 
                  onClick={handlePlayPause}
                  className="text-4xl text-white hover:text-magenta-500 transition-colors"
                >
                  {isPlaying ? '[||]' : '[>]'}
                </button>
                <button onClick={handleNext} className="text-2xl text-gray-400 hover:text-cyan-400 transition-colors">
                  {'[>>]'}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full p-3 text-left border-2 transition-all flex justify-between items-center ${
                    currentTrackIndex === idx 
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' 
                      : 'border-transparent hover:border-white/20 text-gray-500'
                  }`}
                >
                  <div>
                    <div className="text-lg truncate">{track.title}</div>
                    <div className="text-sm opacity-60">{track.artist}</div>
                  </div>
                  {currentTrackIndex === idx && isPlaying && (
                    <span className="text-magenta-500 animate-pulse">_ACTIVE</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-gray-500 text-lg tracking-[0.3em] z-10">
        // END_OF_LINE //
      </footer>

      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={onTimeUpdate}
        onEnded={handleNext}
      />
    </div>
  );
}
