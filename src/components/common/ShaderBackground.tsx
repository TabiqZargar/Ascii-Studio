import { useRef, useEffect } from "react";

const VS = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.7, 7.8))) * 43758.5);
}

void main() {
    vec2 uv = v_texCoord;
    vec3 color1 = vec3(0.03, 0.03, 0.04);
    float t = u_time * 0.2;
    vec2 p1 = vec2(0.5 + 0.3 * sin(t), 0.5 + 0.2 * cos(t * 0.8));
    vec2 p2 = vec2(0.2 + 0.2 * cos(t * 0.7), 0.8 + 0.1 * sin(t * 1.2));
    float d1 = length(uv - p1);
    float d2 = length(uv - p2);
    vec3 accent1 = vec3(0.06, 0.15, 0.1);
    vec3 accent2 = vec3(0.1, 0.08, 0.15);
    vec3 finalColor = color1;
    finalColor += accent1 * (1.0 - smoothstep(0.0, 0.8, d1)) * 0.4;
    finalColor += accent2 * (1.0 - smoothstep(0.0, 1.0, d2)) * 0.3;
    float grain = hash(uv + fract(u_time)) * 0.03;
    finalColor += grain;
    float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
    finalColor *= vignette;
    gl_FragColor = vec4(finalColor, 1.0);
}`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    function syncSize() {
      const w = canvas!.clientWidth || 1280;
      const h = canvas!.clientHeight || 720;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    const vs = createShader(gl, gl.VERTEX_SHADER, VS);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let raf: number;
    function render(t: number) {
      syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full opacity-40 z-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
