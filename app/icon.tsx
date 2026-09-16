import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #153DFC, #8381FB)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          fontWeight: 900,
          fontSize: 13,
          color: "white",
          letterSpacing: "-0.5px",
        }}
      >
        LC
      </div>
    ),
    { ...size }
  );
}
