import { ImageResponse } from "next/og";

export const alt =
  "HandheldAtlas — tested handheld settings, benchmarks and guides";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 20% 10%, rgba(239,35,60,0.30), transparent 34%), radial-gradient(circle at 85% 85%, rgba(24,215,255,0.22), transparent 35%), linear-gradient(135deg, #05070d, #0b1020 55%, #12070b)",
          color: "white",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(239,35,60,0.55)",
                background: "rgba(239,35,60,0.12)",
                color: "#ff4d63",
                fontWeight: 900,
                fontSize: 34,
                letterSpacing: "-0.08em",
              }}
            >
              HA
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: "-0.045em",
                }}
              >
                HandheldAtlas
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: "#18d7ff",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Performance intelligence
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
            <div
              style={{
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.055em",
              }}
            >
              Stop guessing. Start with tested handheld data.
            </div>

            <div
              style={{
                marginTop: 26,
                fontSize: 25,
                lineHeight: 1.45,
                color: "#a8b2c5",
              }}
            >
              Presets, benchmarks, device profiles, guides and community proof for Steam Deck, ROG Ally, Legion Go and more.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#718096",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>Tested settings</span>
            <span style={{ color: "#ef233c" }}>•</span>
            <span>Measured performance</span>
            <span style={{ color: "#18d7ff" }}>•</span>
            <span>Community validated</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
