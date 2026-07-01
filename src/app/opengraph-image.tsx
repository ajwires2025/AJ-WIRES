import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { company } from "@/lib/site-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoBuffer = await readFile(join(process.cwd(), "public/logo-mark-white.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #122036 0%, #0c1626 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={64} height={64} alt="" style={{ objectFit: "contain" }} />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>A.J. WIRES</div>
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700, marginTop: 48, maxWidth: 980 }}>
          {company.tagline}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#f59e0b", marginTop: 28 }}>
          Galvanized Barbed Wire · Chain Link Fencing · GI Wire
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
          Medchal, Hyderabad, Telangana, India
        </div>
      </div>
    ),
    { ...size }
  );
}
