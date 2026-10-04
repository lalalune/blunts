import { useEffect, useRef, useState } from "react";
export function Tray({ value }: { value: string }) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<{
    update: (value: string) => void;
    dispose: () => void;
  } | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void import("./tray-scene.js")
      .then(({ createTrayScene }) => {
        if (cancelled || !host.current || !canvas.current) return;
        try {
          scene.current = createTrayScene(canvas.current, host.current);
          scene.current.update(latest.current);
        } catch {
          setUnavailable(true);
        }
      })
      .catch(() => setUnavailable(true));
    const lost = () => {
      scene.current?.dispose();
      scene.current = null;
      setUnavailable(true);
    };
    const element = canvas.current;
    element?.addEventListener("webglcontextlost", lost);
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
      element?.removeEventListener("webglcontextlost", lost);
    };
  }, []);
  useEffect(() => scene.current?.update(value), [value]);
  return (
    <div className="tray-scene" ref={host} aria-hidden="true">
      <canvas ref={canvas} />
      {unavailable && (
        <div className="tray-fallback">
          <span>blunt$</span>
        </div>
      )}
    </div>
  );
}
