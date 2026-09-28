import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/data";

export const alt = "Portafolio de desarrollador Full Stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Preview card for WhatsApp, LinkedIn, X and Google Discover: Aero-blue glass with the name and role. */
export default async function OpengraphImage() {
  const profile = await getProfile();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          color: "white",
          background: "linear-gradient(135deg, #0b3a6b 0%, #1d76c4 55%, #58b3ea 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85, letterSpacing: 4 }}>KHOOPPER.COM</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, marginTop: 24 }}>{profile.name}</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 16 }}>{profile.headline}</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 10, opacity: 0.9 }}>{profile.specialty}</div>
      </div>
    ),
    size,
  );
}
