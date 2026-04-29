"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Grid3X3 } from "lucide-react";

export default function Home() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [gridSize, setGridSize] = useState(2);
  const [lineWidth, setLineWidth] = useState(8);
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
  const [paper, setPaper] = useState("A4");
  const [dpi, setDpi] = useState(150); // high quality export
  const lastTouch = useRef(null);
  const lastDistance = useRef(null);
  const [editMode, setEditMode] = useState(false);

  const [transform, setTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const PAPER_SIZES = {
    A4: { w: 210, h: 297 },
    A3: { w: 297, h: 420 },
    A2: { w: 420, h: 594 },
    A1: { w: 594, h: 841 },
    A0: { w: 841, h: 1189 },
  };
  const mmToPx = (mm) => (mm / 25.4) * dpi;
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const getSpacing = () => {
    if (gridSize <= 0) return 0;

    if (unit === "px") return gridSize;

    if (unit === "cm") return (gridSize / 2.54) * dpi;

    if (unit === "inch") return gridSize * dpi;

    return gridSize;
  };
  const drawCanvas = () => {
    const safeDpi = Number(dpi) || 0;
    const safeGridSize = Number(gridSize) || 0;
    const safeLineWidth = Number(lineWidth) || 0;
    if (safeDpi <= 0) return;
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new window.Image();
    img.src = image;

    img.onload = () => {
      const { w, h } = PAPER_SIZES[paper];

      const canvasWidth = mmToPx(w);
      const canvasHeight = mmToPx(h);

      // 1️⃣ Set real canvas resolution
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 2️⃣ Scale for display (responsive)
      const scale = Math.min(
        window.innerWidth * 0.9 / canvasWidth,
        window.innerHeight * 0.8 / canvasHeight
      );

      canvas.style.width = `${canvasWidth * scale}px`;
      canvas.style.height = `${canvasHeight * scale}px`;

      // 3️⃣ Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 4️⃣ Apply filters (ONLY for image)
      ctx.filter = `
    brightness(${brightness}%)
    contrast(${contrast}%)
    saturate(${saturation}%)
  `;

      // ✅ 5️⃣ DRAW IMAGE HERE
      const imgRatio = img.width / img.height;
      const canvasRatio = canvasWidth / canvasHeight;

      // base fit (contain)
      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;

      if (imgRatio > canvasRatio) {
        drawHeight = canvasWidth / imgRatio;
      } else {
        drawWidth = canvasHeight * imgRatio;
      }

      // apply zoom
      drawWidth *= transform.scale;
      drawHeight *= transform.scale;

      // center + offset
      const x = (canvasWidth - drawWidth) / 2 + transform.offsetX;
      const y = (canvasHeight - drawHeight) / 2 + transform.offsetY;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // 6️⃣ Reset filter (so grid is not affected)
      ctx.filter = "none";

      // 7️⃣ Draw grid on top
      if (safeGridSize > 0 && safeLineWidth > 0) {
        drawGrid(ctx, canvasWidth, canvasHeight);
      }
    };
  };

  const drawGrid = (ctx, width, height) => {

    const spacing = getSpacing();

    if (!spacing || spacing <= 0) return;

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
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e) => {
    if (!editMode) return;

    if (e.touches.length === 1) {
      lastTouch.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const handleTouchMove = (e) => {
    if (!editMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 👉 PAN (1 finger)
    if (e.touches.length === 1 && lastTouch.current) {
      const dx =
        (e.touches[0].clientX - lastTouch.current.x) * scaleX;
      const dy =
        (e.touches[0].clientY - lastTouch.current.y) * scaleY;

      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));

      lastTouch.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    // 👉 PINCH ZOOM (2 fingers)
    if (e.touches.length === 2 && lastDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const zoom = distance / lastDistance.current;

      setTransform((prev) => ({
        ...prev,
        scale: Math.min(5, Math.max(0.2, prev.scale * zoom)),
      }));

      lastDistance.current = distance;
    }
  };
  const handleTouchEnd = () => {
    lastTouch.current = null;
    lastDistance.current = null;
  };
  const handleMouseDown = (e) => {
    if (!editMode) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const dx = (e.clientX - lastPos.current.x) * scaleX;
    const dy = (e.clientY - lastPos.current.y) * scaleY;

    setTransform((prev) => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }));

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
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
  }, [image, gridSize, showDiagonal, diagonalType, lineWidth, strokeColor, unit, opacity, brightness, contrast, saturation, paper, dpi, editMode, transform]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleWheel = (e) => {
      if (!editMode) return;

      e.preventDefault(); // ✅ now allowed

      const zoom = e.deltaY > 0 ? 0.97 : 1.03;

      setTransform((prev) => ({
        ...prev,
        scale: Math.min(5, Math.max(0.2, prev.scale * zoom)),
      }));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [editMode]);
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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (editMode) {
      setShowControls(false);
    } else {
      setShowControls(true);
    }
    const preventScroll = (e) => {
      if (editMode) e.preventDefault();
    };

    canvas.addEventListener("touchmove", preventScroll, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchmove", preventScroll);
    };

  }, [editMode]);
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
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900 overflow-hidden">

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ touchAction: editMode ? "none" : "auto" }}
          className={`rounded-sm ${image ? 'shadow-lg' : ''} transition-all duration-300 max-w-full max-h-[70vh] z-10`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}

          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}

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
            <div className="flex flex-col gap-1">

              <label className="text-[10px] uppercase text-zinc-500">
                Paper
              </label>
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="px-1 py-0.5 border rounded bg-gray-50 dark:bg-zinc-800"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="A2">A2</option>
                <option value="A1">A1</option>
                <option value="A0">A0</option>
              </select>
              <label className="flex items-center gap-2">
                DPI
                <input
                  type="number"
                  min={72}
                  max={600}
                  value={dpi}
                  onChange={(e) => {
                    const val = e.target.value;

                    // allow empty while typing
                    if (val === "") {
                      setDpi("");
                      return;
                    }

                    const num = Number(val);
                    if (!isNaN(num)) {
                      setDpi(num);
                    }
                  }}
                  onBlur={() => {
                    if (!dpi || dpi < 72) setDpi(72);
                    else if (dpi > 600) setDpi(600);
                  }}
                  className="w-16 px-1 py-0.5 border rounded text-xs"
                />
              </label>
            </div>
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
                    min={1}
                    step={0.1}
                    value={lineWidth}
                    onChange={(e) => {
                      const val = e.target.value;

                      // allow empty while typing
                      if (val === "") {
                        setLineWidth("");
                        return;
                      }

                      const num = Number(val);
                      if (!isNaN(num)) {
                        setLineWidth(num);
                      }
                    }}
                    onBlur={() => {
                      if (gridSize === "" || gridSize < 1) {
                        setLineWidth(1);
                      }
                    }}
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
                  min={1}
                  step={0.1}
                  value={gridSize}
                  onChange={(e) => {
                    const val = e.target.value;

                    // allow empty while typing
                    if (val === "") {
                      setGridSize("");
                      return;
                    }

                    const num = Number(val);
                    if (!isNaN(num)) {
                      setGridSize(num);
                    }
                  }}
                  onBlur={() => {
                    if (gridSize === "" || gridSize < 1) {
                      setGridSize(1);
                    }
                  }}
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
              <span className="uppercase text-[10px] text-zinc-500 flex items-center gap-2">
                Adjust
                <button
                  className="rounded-sm bg-gray-600 p-1 text-white"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                  }}>Reset</button>
              </span>

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
        {image &&
          <div
            className="fixed top-4 left-4 p-3 rounded-full bg-black text-white shadow-lg">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-2 py-1 bg-zinc-700 text-white rounded text-xs md:text-md"
            >
              Edit Image
            </button>
            {editMode && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  ✔
                </button>

                <button
                  onClick={() => {
                    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
                    setEditMode(false);
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        }
      </div>
    </>
  );
}