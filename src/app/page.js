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
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [unit, setUnit] = useState("cm"); // cm | px
  const [opacity, setOpacity] = useState(0.7);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [particles, setParticles] = useState([]);
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const getSpacing = () => {
    const dpr = window.devicePixelRatio || 1;

    if (unit === "px") return gridSize;

    if (unit === "cm") {
      return gridSize * (96 * dpr) / 2.54;
    }

    if (unit === "inch") {
      return gridSize * 96 * dpr;
    }

    return gridSize;
  };
  const drawCanvas = () => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new window.Image();
    img.src = image;

    img.onload = () => {
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

      // 🎨 Apply filters BEFORE drawing image
      ctx.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
    `;

      ctx.drawImage(img, 0, 0, width, height);

      // reset filter so grid is not affected
      ctx.filter = "none";

      drawGrid(ctx, width, height);
    };
  };

  const drawGrid = (ctx, width, height) => {
    const spacing = getSpacing();

    ctx.strokeStyle = hexToRgba(strokeColor, opacity);
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
  }, [image, gridSize, showDiagonal, diagonalType, lineWidth, strokeColor, unit, opacity, brightness, contrast, saturation]);


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
    w-full h-200
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
          className={`rounded-sm ${image ? 'shadow-lg' : ''} transition-all duration-300 max-w-full max-h-[70vh] z-10`}
        />

        {/* Floating Controls */}
        <div
          className={`
    backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 
    border border-white/20 shadow-2xl rounded-2xl
    transition-all duration-300

    /* 📱 Mobile → bottom panel */
    fixed bottom-3 left-2 right-2 z-20
    max-h-[45vh] overflow-y-auto p-3

    /* 💻 Desktop → right sidebar */
    md:top-1/2 md:right-4 md:left-auto md:bottom-auto
    md:-translate-y-1/2 md:w-72 md:max-h-[80vh]
    md:rounded-2xl

    ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 md:translate-y-[-50%]"}
  `}
        >
          <div className="flex flex-col gap-3 text-xs">
            {/* 📂 Actions */}
            <div className="flex flex-col gap-2">
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
                className="text-[10px] bg-blue-400 p-1 rounded text-white cursor-pointer"
              />


            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-1 rounded bg-black text-white"
              >
                ⬇
              </button>

              <button
                onClick={handleRemoveImage}
                className="flex-1 py-1 rounded bg-red-500 text-white"
              >
                ✕
              </button>
            </div>
            {/* 🎨 Appearance */}
            <div className="flex flex-col gap-2">
              <span className="uppercase text-[10px] text-zinc-500">Appearance</span>

              <div className="flex items-center justify-start gap-2">
                <label className="flex items-center gap-2">
                  Color
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-6 h-6 rounded border"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Thickness
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={lineWidth}
                    onChange={(e) =>
                      setLineWidth(Math.max(0.1, Number(e.target.value)))
                    }
                    className="w-14 px-1 py-0.5 border rounded bg-gray-50 dark:bg-zinc-800"
                  />
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  Opacity

                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>
            </div>

            {/* 📏 Grid */}
            <div className="flex flex-col gap-2">
              <span className="uppercase text-[10px] text-zinc-500">Grid</span>

              <div className="flex gap-2">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-1 py-0.5 border rounded bg-gray-50 dark:bg-zinc-800"
                >
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                  <option value="px">px</option>
                </select>

                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={gridSize}
                  onChange={(e) =>
                    setGridSize(Math.max(0.1, Number(e.target.value)))
                  }
                  className="w-14 px-1 py-0.5 border rounded bg-gray-50 dark:bg-zinc-800"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showDiagonal}
                  onChange={(e) => setShowDiagonal(e.target.checked)}
                />
                Diagonal
              </label>

              {showDiagonal && (
                <select
                  value={diagonalType}
                  onChange={(e) => setDiagonalType(e.target.value)}
                  className="px-1 py-0.5 border rounded bg-gray-50 dark:bg-zinc-800"
                >
                  <option value="left">↘</option>
                  <option value="right">↙</option>
                  <option value="both">✖</option>
                </select>
              )}
            </div>

            {/* 🎛 Adjust */}
            <div className="flex flex-col gap-2">
              <span className="uppercase text-[10px] text-zinc-500">Adjust</span>

              {[
                { v: brightness, set: setBrightness, min: 50, max: 150 },
                { v: contrast, set: setContrast, min: 50, max: 150 },
                { v: saturation, set: setSaturation, min: 0, max: 200 },
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-2 justify-between w-[80%]">
                  {["Brightness", "Contrast", "Saturation"][i]}
                  <input
                    key={i}
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={item.v}
                    onChange={(e) => item.set(Number(e.target.value))}
                  /></label>
              ))}
            </div>

          </div>
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