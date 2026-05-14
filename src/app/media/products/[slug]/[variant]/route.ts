import { access, readFile } from "node:fs/promises";
import path from "node:path";

const palettes = [
  ["#0b1022", "#f447a1", "#7b4dff"],
  ["#131a35", "#ff77bf", "#7b4dff"],
  ["#0f1630", "#f447a1", "#9a6fff"],
  ["#111a3b", "#ff91cd", "#6a48ff"],
];

const generatedImagesDirectory = path.join(
  process.cwd(),
  "public",
  "generated",
  "products",
);
const generatedImageExtensions = [".webp", ".png", ".jpg", ".jpeg"] as const;
const contentTypeByExtension: Record<(typeof generatedImageExtensions)[number], string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
type IllustrationKind =
  | "generic"
  | "foldable-phone"
  | "speaker"
  | "earbuds"
  | "microphone"
  | "headphones"
  | "controller"
  | "keyboard"
  | "mouse"
  | "monitor"
  | "chair"
  | "desk-mat"
  | "lamp"
  | "camera"
  | "thermostat"
  | "doorbell"
  | "vacuum"
  | "air-care"
  | "bag"
  | "wallet"
  | "watchband"
  | "sunglasses"
  | "sneakers"
  | "hoodie";

function resolveIllustrationKind(slug: string): IllustrationKind {
  if (slug.includes("fold")) {
    return "foldable-phone";
  }

  if (slug.includes("headphones") || slug.includes("headset")) {
    return "headphones";
  }

  if (slug.includes("earbuds")) {
    return "earbuds";
  }

  if (slug.includes("speaker")) {
    return "speaker";
  }

  if (slug.includes("mic")) {
    return "microphone";
  }

  if (slug.includes("controller")) {
    return "controller";
  }

  if (slug.includes("keyboard")) {
    return "keyboard";
  }

  if (slug.includes("mouse")) {
    return "mouse";
  }

  if (slug.includes("monitor")) {
    return "monitor";
  }

  if (slug.includes("chair")) {
    return "chair";
  }

  if (slug.includes("desk-mat")) {
    return "desk-mat";
  }

  if (slug.includes("lamp")) {
    return "lamp";
  }

  if (slug.includes("camera")) {
    return "camera";
  }

  if (slug.includes("thermostat")) {
    return "thermostat";
  }

  if (slug.includes("doorbell")) {
    return "doorbell";
  }

  if (slug.includes("vacuum") || slug.includes("cleanbot")) {
    return "vacuum";
  }

  if (slug.includes("air-care")) {
    return "air-care";
  }

  if (slug.includes("bag")) {
    return "bag";
  }

  if (slug.includes("wallet")) {
    return "wallet";
  }

  if (slug.includes("watchband")) {
    return "watchband";
  }

  if (slug.includes("sunglasses")) {
    return "sunglasses";
  }

  if (slug.includes("sneakers")) {
    return "sneakers";
  }

  if (slug.includes("hoodie")) {
    return "hoodie";
  }

  return "generic";
}

function renderIllustration(kind: IllustrationKind) {
  const fill = 'rgba(255,255,255,0.18)';
  const stroke = 'rgba(255,255,255,0.78)';
  const softStroke = 'rgba(255,255,255,0.52)';

  switch (kind) {
    case "foldable-phone":
      return `
        <rect x="332" y="220" width="238" height="560" rx="42" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="630" y="220" width="238" height="560" rx="42" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="590" y="220" width="20" height="560" rx="10" fill="rgba(255,255,255,0.48)" />
        <circle cx="430" cy="300" r="28" fill="none" stroke="${stroke}" stroke-width="10" />
        <circle cx="430" cy="386" r="28" fill="none" stroke="${stroke}" stroke-width="10" />
      `;
    case "headphones":
      return `
        <path d="M360 610v-80c0-150 98-250 240-250s240 100 240 250v80" fill="none" stroke="${stroke}" stroke-width="28" stroke-linecap="round" />
        <rect x="332" y="570" width="110" height="176" rx="42" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="758" y="570" width="110" height="176" rx="42" fill="${fill}" stroke="${stroke}" stroke-width="12" />
      `;
    case "earbuds":
      return `
        <rect x="340" y="520" width="520" height="188" rx="82" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M340 610h520" fill="none" stroke="${softStroke}" stroke-width="10" />
        <path d="M450 326c0-48 32-78 78-78v142c-43 0-78-28-78-64z" fill="${fill}" stroke="${stroke}" stroke-width="10" />
        <rect x="498" y="394" width="18" height="104" rx="9" fill="${softStroke}" />
        <path d="M672 326c0-48 32-78 78-78v142c-43 0-78-28-78-64z" fill="${fill}" stroke="${stroke}" stroke-width="10" />
        <rect x="720" y="394" width="18" height="104" rx="9" fill="${softStroke}" />
      `;
    case "speaker":
      return `
        <rect x="408" y="220" width="384" height="640" rx="96" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="426" r="92" fill="none" stroke="${stroke}" stroke-width="14" />
        <circle cx="600" cy="426" r="38" fill="rgba(255,255,255,0.3)" />
        <circle cx="600" cy="670" r="130" fill="none" stroke="${stroke}" stroke-width="14" />
        <circle cx="600" cy="670" r="54" fill="rgba(255,255,255,0.24)" />
      `;
    case "microphone":
      return `
        <rect x="474" y="250" width="252" height="338" rx="126" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M430 544c0 94 76 166 170 166s170-72 170-166" fill="none" stroke="${stroke}" stroke-width="18" stroke-linecap="round" />
        <rect x="582" y="706" width="36" height="116" rx="18" fill="${softStroke}" />
        <rect x="486" y="822" width="228" height="28" rx="14" fill="${softStroke}" />
      `;
    case "controller":
      return `
        <path d="M322 598c0-118 90-206 202-206h152c112 0 202 88 202 206 0 92-56 156-134 156-68 0-88-46-140-46s-72 46-140 46c-78 0-142-64-142-156z" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M462 568h92M508 522v92" stroke="${stroke}" stroke-width="18" stroke-linecap="round" />
        <circle cx="720" cy="540" r="18" fill="${stroke}" />
        <circle cx="776" cy="592" r="18" fill="${stroke}" />
        <circle cx="664" cy="592" r="18" fill="${stroke}" />
        <circle cx="720" cy="646" r="18" fill="${stroke}" />
      `;
    case "keyboard":
      return `
        <rect x="236" y="432" width="728" height="300" rx="44" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M294 494h612M294 560h612M294 626h612" stroke="${softStroke}" stroke-width="10" />
        <path d="M356 466v238M454 466v238M552 466v238M650 466v238M748 466v238M846 466v238" stroke="${softStroke}" stroke-width="8" />
      `;
    case "mouse":
      return `
        <path d="M600 262c130 0 206 104 206 248 0 170-92 298-206 298s-206-128-206-298c0-144 76-248 206-248z" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M600 262v180" stroke="${stroke}" stroke-width="12" />
        <rect x="576" y="364" width="48" height="84" rx="24" fill="rgba(255,255,255,0.26)" />
      `;
    case "monitor":
      return `
        <rect x="232" y="252" width="736" height="442" rx="34" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="566" y="698" width="68" height="100" rx="20" fill="${softStroke}" />
        <rect x="460" y="798" width="280" height="34" rx="17" fill="${softStroke}" />
      `;
    case "chair":
      return `
        <rect x="440" y="248" width="320" height="282" rx="88" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="406" y="500" width="388" height="148" rx="72" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="578" y="648" width="44" height="140" rx="22" fill="${softStroke}" />
        <path d="M600 788l-116 70M600 788l116 70M600 788v84" stroke="${stroke}" stroke-width="12" stroke-linecap="round" />
      `;
    case "desk-mat":
      return `
        <path d="M220 666h760c42 0 76 34 76 76v24H220z" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M240 666v-54c0-46 38-84 84-84h596" fill="none" stroke="${stroke}" stroke-width="12" />
        <path d="M900 528c38 0 68 30 68 68v48" fill="none" stroke="${softStroke}" stroke-width="10" />
      `;
    case "lamp":
      return `
        <path d="M600 284c126 0 228 84 228 188 0 104-102 188-228 188s-228-84-228-188c0-104 102-188 228-188z" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="566" y="648" width="68" height="126" rx="26" fill="${softStroke}" />
        <rect x="458" y="774" width="284" height="34" rx="17" fill="${softStroke}" />
      `;
    case "camera":
      return `
        <rect x="268" y="380" width="664" height="352" rx="64" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="346" y="326" width="174" height="86" rx="34" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="556" r="112" fill="none" stroke="${stroke}" stroke-width="16" />
        <circle cx="600" cy="556" r="42" fill="rgba(255,255,255,0.3)" />
        <circle cx="784" cy="466" r="22" fill="${stroke}" />
      `;
    case "thermostat":
      return `
        <circle cx="600" cy="542" r="210" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="542" r="128" fill="none" stroke="${stroke}" stroke-width="10" />
        <path d="M600 468v74" stroke="${stroke}" stroke-width="14" stroke-linecap="round" />
        <circle cx="600" cy="592" r="24" fill="${stroke}" />
      `;
    case "doorbell":
      return `
        <rect x="470" y="236" width="260" height="604" rx="94" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="380" r="56" fill="none" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="616" r="84" fill="none" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="616" r="24" fill="${stroke}" />
      `;
    case "vacuum":
      return `
        <circle cx="600" cy="594" r="226" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <circle cx="600" cy="594" r="122" fill="none" stroke="${stroke}" stroke-width="10" />
        <rect x="546" y="294" width="108" height="76" rx="28" fill="${fill}" stroke="${stroke}" stroke-width="10" />
      `;
    case "air-care":
      return `
        <rect x="396" y="208" width="408" height="650" rx="128" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M470 404h260M470 476h260M470 548h260M470 620h260" stroke="${softStroke}" stroke-width="12" stroke-linecap="round" />
        <circle cx="600" cy="308" r="28" fill="${stroke}" />
      `;
    case "bag":
      return `
        <rect x="254" y="426" width="692" height="364" rx="76" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M424 426c0-102 70-170 176-170s176 68 176 170" fill="none" stroke="${stroke}" stroke-width="16" />
        <path d="M254 566h692" stroke="${softStroke}" stroke-width="10" />
      `;
    case "wallet":
      return `
        <rect x="244" y="456" width="712" height="318" rx="54" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <path d="M244 566h712" stroke="${softStroke}" stroke-width="10" />
        <circle cx="820" cy="618" r="22" fill="${stroke}" />
      `;
    case "watchband":
      return `
        <rect x="492" y="180" width="216" height="286" rx="82" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="492" y="614" width="216" height="286" rx="82" fill="${fill}" stroke="${stroke}" stroke-width="12" />
        <rect x="458" y="430" width="284" height="220" rx="74" fill="none" stroke="${stroke}" stroke-width="16" />
        <path d="M556 256h88M556 320h88M556 384h88M556 706h88M556 770h88M556 834h88" stroke="${softStroke}" stroke-width="10" stroke-linecap="round" />
      `;
    case "sunglasses":
      return `
        <circle cx="454" cy="554" r="126" fill="none" stroke="${stroke}" stroke-width="14" />
        <circle cx="746" cy="554" r="126" fill="none" stroke="${stroke}" stroke-width="14" />
        <path d="M580 540h40" stroke="${stroke}" stroke-width="14" stroke-linecap="round" />
        <path d="M318 516l-84-34M882 516l84-34" stroke="${stroke}" stroke-width="12" stroke-linecap="round" />
      `;
    case "sneakers":
      return `
        <path d="M294 642c72-12 154-86 220-144 28 70 92 122 184 150 72 22 144 34 208 34 44 0 80 36 80 80H294z" fill="${fill}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round" />
        <path d="M442 680h420M408 732h508" stroke="${softStroke}" stroke-width="10" stroke-linecap="round" />
      `;
    case "hoodie":
      return `
        <path d="M430 312c42-42 94-66 170-66s128 24 170 66l108 114-86 78-38-38v296H346V466l-38 38-86-78z" fill="${fill}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round" />
        <path d="M538 356c20 38 44 58 62 58s42-20 62-58" fill="none" stroke="${softStroke}" stroke-width="10" stroke-linecap="round" />
        <path d="M510 544h180" stroke="${softStroke}" stroke-width="10" stroke-linecap="round" />
      `;
    default:
      return `
        <rect x="180" y="240" width="840" height="620" rx="56" fill="${fill}" />
      `;
  }
}

async function findGeneratedProductImage(slug: string, variant: string) {
  if (!/^[a-z0-9-]+$/i.test(slug) || !/^\d+$/.test(variant)) {
    return null;
  }

  const variantCandidates = variant === "1" ? ["1"] : [variant, "1"];

  for (const variantCandidate of variantCandidates) {
    for (const extension of generatedImageExtensions) {
      const filepath = path.join(
        generatedImagesDirectory,
        slug,
        `${variantCandidate}${extension}`,
      );

      try {
        await access(filepath);
        return {
          filepath,
          contentType: contentTypeByExtension[extension],
        };
      } catch {
        continue;
      }
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; variant: string }> },
) {
  const { slug, variant } = await params;
  const generatedImage = await findGeneratedProductImage(slug, variant);

  if (generatedImage) {
    const imageBuffer = await readFile(generatedImage.filepath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": generatedImage.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  const [base, accent, tertiary] =
    palettes[(Number(variant) - 1 + palettes.length) % palettes.length];
  const label = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const illustration = renderIllustration(resolveIllustrationKind(slug));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="hero" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${base}" />
          <stop offset="50%" stop-color="${tertiary}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" fill="#f5f7fb" />
      <rect x="64" y="64" width="1072" height="1072" rx="120" fill="url(#hero)" />
      <circle cx="950" cy="230" r="140" fill="rgba(255,255,255,0.14)" />
      <circle cx="280" cy="1000" r="190" fill="rgba(255,255,255,0.08)" />
      ${illustration}
      <text x="180" y="960" font-family="Arial, Helvetica, sans-serif" font-size="52" fill="white" opacity="0.84">
        ${label}
      </text>
      <text x="180" y="1032" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="white" opacity="0.66">
        Shopiza premium catalog image ${variant}
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
