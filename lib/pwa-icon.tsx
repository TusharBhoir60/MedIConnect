import { ImageResponse } from "next/og";

export function pwaIcon(opts: { label: string; bg: string; mark: string; size: number }) {
  const { size } = opts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: opts.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#f4efe6",
        }}
      >
        <div style={{ fontSize: Math.round(size * 0.22) }}>{opts.mark}</div>
        <div style={{ fontSize: Math.round(size * 0.08), marginTop: 8, letterSpacing: 3 }}>{opts.label}</div>
      </div>
    ),
    { width: size, height: size },
  );
}
