/**
 * Pipeline profiling for GIF processing.
 * Logs time spent in each stage to console.
 */

export interface PipelineProfile {
  gifParse: number;
  lzwDecode: number;
  frameComposite: number;
  frameSnapshot: number;
  fpsAnalysis: number;
  frameDownsample: number;
  workerTransfer: number;
  workerConvert: number;
  workerTransferBack: number;
  totalGifDecode: number;
  totalPipeline: number;
  frameCount: number;
  sampledFrameCount: number;
  sourceWidth: number;
  sourceHeight: number;
}

const marks: Record<string, number> = {};

export function mark(name: string) {
  marks[name] = performance.now();
}

export function measure(name: string): number {
  const start = marks[name];
  if (start === undefined) return 0;
  const elapsed = performance.now() - start;
  delete marks[name];
  return elapsed;
}

export function logProfile(profile: PipelineProfile) {
  console.group("%c[GIF Profile] Pipeline Timing", "color: #10b981; font-weight: bold");
  console.log(`  GIF Parse (header+GCT):  ${profile.gifParse.toFixed(1)}ms`);
  console.log(`  LZW Decode (all frames): ${profile.lzwDecode.toFixed(1)}ms`);
  console.log(`  Frame Composite:         ${profile.frameComposite.toFixed(1)}ms`);
  console.log(`  Frame Snapshot:          ${profile.frameSnapshot.toFixed(1)}ms`);
  console.log(`  Total GIF Decode:        ${profile.totalGifDecode.toFixed(1)}ms`);
  console.log("  ---");
  console.log(`  FPS Analysis:            ${profile.fpsAnalysis.toFixed(1)}ms`);
  console.log(`  Frame Downsample:        ${profile.frameDownsample.toFixed(1)}ms`);
  console.log(`  Worker Transfer (in):    ${profile.workerTransfer.toFixed(1)}ms`);
  console.log(`  Worker Convert:          ${profile.workerConvert.toFixed(1)}ms`);
  console.log(`  Worker Transfer (out):   ${profile.workerTransferBack.toFixed(1)}ms`);
  console.log("  ---");
  console.log(`  Source: ${profile.sourceWidth}x${profile.sourceHeight}, ${profile.frameCount} frames`);
  console.log(`  Sampled: ${profile.sampledFrameCount} frames`);
  console.log(`  Total Pipeline:          ${profile.totalPipeline.toFixed(1)}ms`);
  console.log("  ---");

  // Identify bottleneck
  const stages = [
    { name: "LZW Decode", time: profile.lzwDecode },
    { name: "Frame Composite", time: profile.frameComposite },
    { name: "Frame Snapshot", time: profile.frameSnapshot },
    { name: "Frame Downsample", time: profile.frameDownsample },
    { name: "Worker Convert", time: profile.workerConvert },
  ].sort((a, b) => b.time - a.time);

  const total = stages.reduce((s, st) => s + st.time, 0);
  console.log("  Stage breakdown (sorted):");
  for (const s of stages) {
    const pct = total > 0 ? ((s.time / total) * 100).toFixed(0) : "0";
    console.log(`    ${s.name}: ${s.time.toFixed(1)}ms (${pct}%)`);
  }
  console.log(`  BOTTLENECK: ${stages[0].name} (${stages[0].time.toFixed(1)}ms, ${total > 0 ? ((stages[0].time / total) * 100).toFixed(0) : 0}% of total)`);
  console.groupEnd();
}
