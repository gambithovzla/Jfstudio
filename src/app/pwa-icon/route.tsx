import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 110,
          background: "#c4587a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 200,
          fontWeight: 800,
          fontFamily: "serif",
          letterSpacing: "-6px",
        }}
      >
        JF
      </div>
    ),
    { width: 512, height: 512 }
  );
}
