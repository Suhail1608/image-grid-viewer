"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Grid3X3 } from "lucide-react";

export default function Home() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [gridSize, setGridSize] = useState(2);
  const [lineWidth, setLineWidth] = useState(1);
  const [showDiagonal, setShowDiagonal] = useState(false);
  const [diagonalType, setDiagonalType] = useState("both");
  const [showControls, setShowControls] = useState(true);
  const [particles, setParticles] = useState([]);
  const getCMToPX = () => (96 * window.devicePixelRatio) / 2.54;

  const drawCanvas = () => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new window.Image();
    img.src = image;

    img.onload = () => {
      // Fit image inside viewport
      const maxWidth = window.innerWidth * 0.95;
      const maxHeight = window.innerHeight * 0.75;

      let width = img.width;
      let height = img.height;

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);

      width *= scale;
      height *= scale;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      drawGrid(ctx, width, height);
    };
  };

  const drawGrid = (ctx, width, height) => {
    const spacing = gridSize * getCMToPX();

    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = lineWidth;

    for (let x = 0; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (showDiagonal) {
      drawDiagonals(ctx, width, height, spacing);
    }
  };

  const drawDiagonals = (ctx, width, height, spacing) => {
    ctx.lineWidth = lineWidth;

    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;

        if (diagonalType === "left" || diagonalType === "both") {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + spacing, y + spacing);
          ctx.stroke();
        }

        if (diagonalType === "right" || diagonalType === "both") {
          ctx.beginPath();
          ctx.moveTo(x + spacing, y);
          ctx.lineTo(x, y + spacing);
          ctx.stroke();
        }
      }
    }
  };

  const handleRemoveImage = () => {
    if (image) URL.revokeObjectURL(image);
    setImage(null);

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    fileInputRef.current.value = "";
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "grid-image.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    drawCanvas();
  }, [image, gridSize, showDiagonal, diagonalType, lineWidth]);


  useEffect(() => {
    const generated = Array.from({ length: 20 }).map((_, i) => {
      const duration = 6 + Math.random() * 6;

      return {
        left: Math.random() * 100,
        duration,
        delay: -Math.random() * duration, // 👈 key fix
      };
    });
    setParticles(generated);
  }, []);
  return (
    <>
      {/* 🌫️ Misty Glow */}
      <div className="absolute bottom-[-95%] left-1/2 -translate-x-1/2 
    w-200 h-200
    bg-linear-to-tr from-fuchsia-400/30 via-purple-400/30 to-orange-400/40
    blur-[120px] opacity-60 animate-pulse" />

      {/* Secondary subtle haze */}
      <div className="absolute bottom-0 left-0 w-full h-40 
    bg-linear-to-t from-fuchsia-400/20 to-transparent dark:from-emerald-300/10" />
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900 overflow-hidden">

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="rounded-sm shadow-lg transition-all duration-300 max-w-full max-h-[70vh] z-10"
        />

        {/* Floating Controls */}
        <div
          className={`
    w-full max-w-4xl mx-auto
    backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 
    border border-white/20 shadow-xl rounded-2xl p-4 
    flex flex-wrap gap-3 items-center justify-center
    transition-all duration-300

    md:static md:translate-x-0 md:bottom-auto md:left-auto md:opacity-100
    fixed bottom-4 left-1/2 -translate-x-1/2
    ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
  `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                if (image) URL.revokeObjectURL(image);
                setImage(URL.createObjectURL(file));
              }
            }}
            className="text-sm"
          />
          Grid (cm)
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={gridSize}
            onChange={(e) => {
              const value = Math.max(0.1, Number(e.target.value));
              setGridSize(value);
            }}
            className="w-16 px-2 py-1 border rounded text-sm bg-gray-50 dark:bg-zinc-800"
            title="Grid (cm)"
          />
          Thickness
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={lineWidth}
            onChange={(e) => {
              const value = Math.max(0.1, Number(e.target.value));
              setLineWidth(value);
            }}
            className="w-16 px-2 py-1 border rounded text-sm bg-gray-50 dark:bg-zinc-800"
            title="Grid (cm)"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={showDiagonal}
              onChange={(e) => setShowDiagonal(e.target.checked)}
            />
            Diagonal
          </label>

          <select
            value={diagonalType}
            onChange={(e) => setDiagonalType(e.target.value)}
            className="px-2 py-1 border rounded text-sm bg-gray-50 dark:bg-zinc-800"
          >
            <option value="left">↘</option>
            <option value="right">↙</option>
            <option value="both">✖</option>
          </select>

          <button
            onClick={handleDownload}
            className="p-2 rounded bg-black text-white hover:scale-105 transition"
          >
            <Download size={16} />
          </button>

          <button
            onClick={handleRemoveImage}
            className="p-2 rounded bg-red-500 text-white hover:scale-105 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Toggle Controls (Mobile) */}
        <button
          onClick={() => setShowControls((p) => !p)}
          className="fixed top-4 right-4 p-3 rounded-full bg-black text-white shadow-lg md:hidden"
        >
          <Grid3X3 size={18} />
        </button>
      </div>
    </>
  );
}