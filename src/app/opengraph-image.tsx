import { ImageResponse } from "next/og";

export const alt = "AMORA · Ropa íntima y deportiva";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #faf8f3 0%, #eaece0 100%)",
          color: "#2b2a26",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 120, letterSpacing: 36, color: "#767c4e", fontWeight: 500 }}>AMORA</div>
        <div style={{ fontSize: 36, marginTop: 12, color: "#6b685f", fontFamily: "Arial, sans-serif" }}>Ropa íntima & deportiva · Cómoda con vos, todos los días</div>
        <div style={{ position: "absolute", bottom: 40, display: "flex", gap: 12 }}>
          {["#767c4e", "#b9bf9c", "#e2dacc", "#e8b4b8"].map((c) => (
            <div key={c} style={{ width: 28, height: 28, borderRadius: 999, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
