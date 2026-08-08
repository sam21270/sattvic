import { ImageResponse } from "next/og";

// Saving the site to an iPhone home screen asked for /apple-touch-icon.png and
// got a 404, which iOS answers with a blurry screenshot of the page. Same
// ImageResponse approach as the social card, so there is no binary to maintain.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          fontSize: 112,
        }}
      >
        🌿
      </div>
    ),
    size,
  );
}
