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

const wixRegular = readFileSync(
  resolve(fontDir, "WixMadeforText-Regular.ttf")
);
const wixMediumItalic = readFileSync(
  resolve(fontDir, "WixMadeforText-MediumItalic.ttf")
);
const jetMono = readFileSync(resolve(fontDir, "JetBrainsMono-Regular.ttf"));

const PAPER = "#F2ECDD";
const INK = "#0E1726";
const INK_SOFT = "#2A3242";
const INK_FAINT = "#6B7184";
const OXBLOOD = "#6F1D2C";
const RULE = "rgba(14, 23, 38, 0.18)";

const markup = html(`
<div style="width:1200px;height:630px;background:${PAPER};color:${INK};display:flex;flex-direction:column;padding:60px 76px;font-family:'Wix Madefor Text';position:relative;">

  <!-- TOP ROW: eyebrow + wordmark -->
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono';font-size:14px;letter-spacing:4px;text-transform:uppercase;color:${INK_FAINT};">
      <div style="width:8px;height:8px;background:${OXBLOOD};border-radius:50%;display:flex;"></div>
      <span style="display:flex;">For operating partners</span>
    </div>
    <div style="font-family:'Wix Madefor Text';font-weight:400;font-size:30px;letter-spacing:-0.5px;color:${INK};display:flex;">
      Catapult<span style="color:${OXBLOOD};display:flex;">.</span>
    </div>
  </div>

  <!-- HEADLINE -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;margin-top:24px;font-family:'Wix Madefor Text';font-weight:400;font-size:104px;letter-spacing:-3.5px;line-height:1.0;color:${INK};">
    <div style="display:flex;">Don’t cut what</div>
    <div style="display:flex;align-items:baseline;gap:24px;">
      <span style="display:flex;">you</span>
      <span style="display:flex;font-style:italic;font-weight:500;color:${OXBLOOD};">can’t see.</span>
    </div>
  </div>

  <!-- HAIRLINE -->
  <div style="height:1px;background:${RULE};display:flex;margin-bottom:20px;"></div>

  <!-- FOOTER: sub + url -->
  <div style="display:flex;justify-content:space-between;align-items:baseline;">
    <span style="font-family:'Wix Madefor Text';font-size:20px;color:${INK_SOFT};display:flex;max-width:780px;line-height:1.4;">
      A hold-period intelligence layer for PE portfolio companies.
    </span>
    <span style="font-family:'JetBrains Mono';font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${INK_FAINT};display:flex;">
      devcatapult.com
    </span>
  </div>

</div>
`);

const svg = await satori(markup, {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "Wix Madefor Text",
      data: wixRegular,
      weight: 400,
      style: "normal",
    },
    {
      name: "Wix Madefor Text",
      data: wixMediumItalic,
      weight: 500,
      style: "italic",
    },
    {
      name: "JetBrains Mono",
      data: jetMono,
      weight: 400,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
const png = resvg.render().asPng();
const outPath = resolve(outDir, "og.png");
writeFileSync(outPath, png);
console.log(`✓ ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
