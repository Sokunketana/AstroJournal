import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface QualityProbeProps {
  onResult: (avgFrameMs: number, renderer: string) => void;
}

const SOFTWARE_RENDERERS = /WebKit WebGL|SwiftShader|llvmpipe|Software/i;

// Reports renderer quality once: known-software renderers are detected
// immediately (frame 1); otherwise real frame times are sampled for ~1s
const QualityProbe: React.FC<QualityProbeProps> = ({ onResult }) => {
  const { gl } = useThree();
  const startedRef = useRef(false);
  const frameRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const rendererRef = useRef("");
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    if (!startedRef.current) {
      startedRef.current = true;
      const ctx = gl.getContext();
      rendererRef.current = ctx.getParameter(ctx.RENDERER) as string;
      if (SOFTWARE_RENDERERS.test(rendererRef.current)) {
        doneRef.current = true;
        onResult(999, rendererRef.current); // force low quality
        return;
      }
    }

    frameRef.current++;
    if (frameRef.current < 30) return; // skip startup burst
    samplesRef.current.push(delta);
    if (samplesRef.current.length >= 60) {
      doneRef.current = true;
      const avg =
        samplesRef.current.reduce((a, b) => a + b, 0) /
        samplesRef.current.length;
      onResult(avg * 1000, rendererRef.current);
    }
  });

  return null;
};

export default QualityProbe;
