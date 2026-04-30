import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const fontDir = resolve(__dirname, "fonts");
const outDir = resolve(root, "public/static");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const bigShouldersBlack = readFileSync(
  resolve(fontDir, "BigShouldersDisplay-Black.woff")
);
const spaceMonoBold = readFileSync(resolve(fontDir, "SpaceMono-Bold.woff"));
const spaceMonoRegular = readFileSync(
  resolve(fontDir, "SpaceMono-Regular.woff")
);

const BONE = "#EAE6D8";
const INK = "#080808";
const ACID = "#CCFF02";
const ACID_DEEP = "#A6CC02";

const markup = html(`
<div style="width:1200px;height:630px;background:${BONE};color:${INK};display:flex;flex-direction:column;padding:48px 64px;font-family:'Space Mono';position:relative;">

  <!-- TOP ROW -->
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:18px;letter-spacing:4px;text-transform:uppercase;font-weight:700;font-family:'Space Mono';">
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="width:14px;height:14px;background:${ACID};display:flex;"></div>
      <span>EST. 2026 / INDEPENDENT STUDIO</span>
    </div>
    <span style="font-family:'Big Shoulders Display';font-weight:900;font-size:42px;letter-spacing:-2px;text-transform:uppercase;">
      CATAPULT<span style="color:${ACID_DEEP};">*</span>
    </span>
  </div>

  <!-- HAIRLINE -->
  <div style="height:2px;background:${INK};margin-top:28px;display:flex;"></div>

  <!-- HEADLINE -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;font-family:'Big Shoulders Display';font-weight:900;font-size:138px;letter-spacing:-7px;line-height:1.0;text-transform:uppercase;color:${INK};">
    <div style="display:flex;">SITES THAT</div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span style="background:${INK};color:${ACID};padding:0 20px;display:flex;line-height:1;">RANK.</span>
      <span style="display:flex;">AI</span>
    </div>
    <div style="display:flex;">THAT SHIPS.</div>
  </div>

  <!-- FOOTER -->
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:18px;letter-spacing:4px;text-transform:uppercase;font-weight:700;padding-top:22px;border-top:2px solid ${INK};font-family:'Space Mono';">
    <span style="display:flex;align-items:center;gap:14px;">
      <span>devcatapult.com</span>
    </span>
    <span style="display:flex;align-items:center;gap:18px;">
      <span style="display:flex;">WEBSITES</span>
      <span style="color:${ACID_DEEP};display:flex;">/</span>
      <span style="display:flex;">SEO</span>
      <span style="color:${ACID_DEEP};display:flex;">/</span>
      <span style="display:flex;">AI</span>
    </span>
  </div>
</div>
`);

const svg = await satori(markup, {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "Big Shoulders Display",
      data: bigShouldersBlack,
      weight: 900,
      style: "normal",
    },
    {
      name: "Space Mono",
      data: spaceMonoBold,
      weight: 700,
      style: "normal",
    },
    {
      name: "Space Mono",
      data: spaceMonoRegular,
      weight: 400,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
const png = resvg.render().asPng();
writeFileSync(resolve(outDir, "og.png"), png);
console.log(
  `Wrote ${resolve(outDir, "og.png")} — ${(png.length / 1024).toFixed(1)} KB`
);
