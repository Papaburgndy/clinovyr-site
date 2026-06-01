import fs from "fs";
import path from "path";

const INDUSTRIES = ["medical", "real-estate", "legal", "construction", "wellness"];

const colors = {
  ink: "#0d0f12",
  paper: "#f5f2ed",
  accent: "#1a6b5a",
  gold: "#c49a3c",
  muted: "#7a7468",
  rule: "#d8d3ca",
};

function pageSvg(industry: string, page: number, title: string): string {
  const isCover = page === 1;
  const bg = isCover ? colors.ink : colors.paper;
  const titleColor = isCover ? colors.gold : colors.ink;
  const subColor = isCover ? colors.paper : colors.muted;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
  <rect width="400" height="520" fill="${bg}"/>
  ${isCover ? `<text x="40" y="60" fill="${colors.accent}" font-family="monospace" font-size="11" letter-spacing="2">CLINOVYR</text>` : `<text x="40" y="40" fill="${colors.muted}" font-family="monospace" font-size="9">SAMPLE PAGE ${page}</text>`}
  <text x="40" y="${isCover ? 200 : 100}" fill="${titleColor}" font-family="Georgia, serif" font-size="${isCover ? 22 : 18}" font-weight="600">${title}</text>
  <text x="40" y="${isCover ? 240 : 140}" fill="${subColor}" font-family="system-ui, sans-serif" font-size="12">${industry.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Playbook</text>
  ${!isCover ? `<rect x="40" y="170" width="320" height="8" fill="${colors.accent}" opacity="0.3"/><rect x="40" y="190" width="280" height="6" fill="${colors.rule}"/><rect x="40" y="210" width="300" height="6" fill="${colors.rule}"/><rect x="40" y="250" width="320" height="60" fill="#ede9e2" stroke="${colors.gold}" stroke-width="2"/><text x="52" y="275" fill="${colors.ink}" font-family="system-ui" font-size="10">Callout: implementation tip</text>` : `<text x="40" y="400" fill="${colors.muted}" font-family="monospace" font-size="10">Version 1.0 · clinovyr.com</text>`}
</svg>`;
}

const titles = ["AI Playbook", "Chapter Preview", "Tools & Prompts"];

const root = path.join(__dirname, "..", "public", "previews");
for (const industry of INDUSTRIES) {
  const dir = path.join(root, industry);
  fs.mkdirSync(dir, { recursive: true });
  for (let page = 1; page <= 3; page++) {
    fs.writeFileSync(
      path.join(dir, `page-${page}.svg`),
      pageSvg(industry, page, titles[page - 1] ?? "Preview"),
    );
  }
}
console.log("Preview SVGs generated.");
