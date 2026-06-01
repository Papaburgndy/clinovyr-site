import { ImageResponse } from "next/og";

export const alt = "Clinovyr — AI Consulting for Placer County Businesses";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function loadGoogleFont(font: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&display=swap`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error(`Failed to load font: ${font}`);
}

export default async function Image() {
  const [displayFont, monoFont] = await Promise.all([
    loadGoogleFont("Cormorant+Garamond", 600),
    loadGoogleFont("DM+Mono", 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0d0f12",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "6px",
            height: "100%",
            backgroundColor: "#1a6b5a",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            backgroundColor: "#1a6b5a",
            opacity: 0.08,
            transform: "translate(40%, 40%)",
          }}
        />
        <div
          style={{
            fontFamily: "Cormorant Garamond",
            fontSize: 96,
            fontWeight: 600,
            color: "#f5f2ed",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          Clinovyr
        </div>
        <div
          style={{
            fontFamily: "Cormorant Garamond",
            fontSize: 40,
            fontWeight: 400,
            fontStyle: "italic",
            color: "#2d9e88",
            marginBottom: 48,
          }}
        >
          Intelligence, Applied.
        </div>
        <div
          style={{
            fontFamily: "DM Mono",
            fontSize: 22,
            fontWeight: 400,
            color: "#7a7468",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          AI Consulting | Granite Bay, CA
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cormorant Garamond",
          data: displayFont,
          style: "normal",
          weight: 600,
        },
        {
          name: "DM Mono",
          data: monoFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
