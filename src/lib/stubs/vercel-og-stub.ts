/**
 * Stub for @vercel/og / next/og when OG images are static (public/og.svg).
 * Prevents resvg.wasm (~1.4 MiB) and yoga.wasm from entering the Worker bundle.
 */
export class ImageResponse extends Response {
  constructor() {
    super("OG image generation is disabled", { status: 501 });
  }
}

const vercelOgStub = { ImageResponse };
export default vercelOgStub;
