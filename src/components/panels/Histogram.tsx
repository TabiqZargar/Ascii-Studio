import { useRef, useEffect } from "react";

interface Props {
  imageData: ImageData | null;
}

export default function Histogram({ imageData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const { data } = imageData;
    const rHist = new Uint32Array(256);
    const gHist = new Uint32Array(256);
    const bHist = new Uint32Array(256);
    const lumHist = new Uint32Array(256);

    for (let i = 0; i < data.length; i += 4) {
      rHist[data[i]]++;
      gHist[data[i + 1]]++;
      bHist[data[i + 2]]++;
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lumHist[lum]++;
    }

    const maxVal = Math.max(...Array.from(lumHist).filter((_, i) => i > 0 && i < 255));

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ctx.clearRect(0, 0, w, h);

    const drawChannel = (hist: Uint32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const y = h - (hist[i] / maxVal) * h * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    ctx.globalAlpha = 0.3;
    drawChannel(rHist, "#ef4444");
    drawChannel(gHist, "#22c55e");
    drawChannel(bHist, "#3b82f6");
    ctx.globalAlpha = 0.8;
    drawChannel(lumHist, "#ffffff");
    ctx.globalAlpha = 1;
  }, [imageData]);

  return (
    <div className="mt-2">
      <div className="mb-1 text-xs text-zinc-500">Histogram</div>
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className="w-full rounded-md border border-zinc-700 bg-zinc-800"
      />
    </div>
  );
}
