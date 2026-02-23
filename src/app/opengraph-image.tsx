import { ImageResponse } from "next/og";

export const alt = "alpa.md — Encrypted markdown sharing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#18181b",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            End-to-end encrypted
          </span>
        </div>

        <h1
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          alpa.md
        </h1>

        <p
          style={{
            fontSize: "28px",
            color: "#71717a",
            marginTop: "24px",
            lineHeight: 1.4,
            maxWidth: "700px",
          }}
        >
          Share markdown, keep it secret. Password-protected links with AES-256-GCM encryption.
        </p>
      </div>
    ),
    { ...size },
  );
}
