import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)); // tests/fixtures
const p = (rel: string): string => join(ROOT, rel);

export const fixtureRoot = ROOT;
export const fixtureDir = {
  formats: join(ROOT, "formats"),
  hostile: join(ROOT, "hostile"),
  media: join(ROOT, "media"),
  documents: join(ROOT, "documents"),
  data: join(ROOT, "data"),
  content: join(ROOT, "content"),
  security: join(ROOT, "security"),
};

export const fixtures = {
  image: {
    base: {
      png200: p("test-200x150.png"),
      jpg100: p("test-100x100.jpg"),
      webp50: p("test-50x50.webp"),
      svg100: p("test-100x100.svg"),
      heic200: p("test-200x150.heic"),
    },
    scene: p("test-scene.png"),
    portrait: {
      jpg: p("content/portrait-color.jpg"),
      heic: p("content/portrait-headshot.heic"),
      bw: p("content/portrait-bw.jpeg"),
      isolated: p("content/portrait-isolated.png"),
    },
    multiFace: p("content/multi-face.webp"),
    redEye: p("content/red-eye.jpg"),
    exifGps: p("test-with-exif.jpg"),
    transparent: p("test-fake-transparency.png"),
    animated: {
      gif: p("animated.gif"),
      webp: p("animated.webp"),
      real: p("content/animated-simpsons.gif"),
    },
    ocr: {
      clean: p("content/ocr-clean.png"),
      japanese: p("content/ocr-japanese.png"),
      chat: p("content/ocr-chat.jpeg"),
    },
    code: {
      barcodePng: p("content/barcode.png"),
      barcodeAvif: p("content/barcode.avif"),
      qrPng: p("content/qr-code.png"),
      qrSvg: p("content/qr-code.svg"),
      qrAvif: p("content/qr-code.avif"),
    },
    svgLogo: p("content/svg-logo.svg"),
    motorcycle: p("content/motorcycle.heif"),
    crossFormatChat: p("content/cross-format-chat.webp"),
    portraitJpg: p("test-portrait.jpg"),
    portraitHeic: p("test-portrait.heic"),
    watermark: p("content/watermark.jpg"),
    stressLarge: p("content/stress-large.jpg"),
    edge: {
      px1: p("test-1x1.png"),
      blank: p("test-blank.png"),
      tall: p("test-portrait-tall.png"),
      extreme: p("test-portrait-extreme.png"),
    },
    formats: (ext: string) => p(`formats/sample.${ext}`),
    multipageTiff: p("formats/multipage.tiff"),
    hostile: {
      truncated: p("hostile/truncated.jpg"),
      garbage: p("hostile/garbage.jpg"),
      bomb: p("hostile/bomb-50000x50000.png"),
      extMismatch: p("hostile/png-bytes.jpg"),
    },
    hostileEmpty: { zeroByte: p("hostile/zero-byte.png") },
  },
  video: {
    hero: {
      mp4: p("content/media-30s.mp4"),
      mov: p("content/hero.mov"),
      webm: p("content/hero.webm"),
      mkv: p("content/hero.mkv"),
      avi: p("content/hero.avi"),
    },
    speech: { mp4: p("content/speech-10s.mp4") },
    withMeta: p("content/video-with-meta.mp4"),
    tiny: (ext: string) => p(`media/tiny.${ext}`),
    subs: {
      mkv: p("media/tiny-subs.mkv"),
      srt: p("media/tiny.srt"),
      vtt: p("media/tiny.vtt"),
      ass: p("media/tiny.ass"),
    },
    hostile: { truncated: p("hostile/truncated.mp4") },
  },
  audio: {
    speech: {
      wav: p("content/speech-10s.wav"),
      flac: p("content/speech.flac"),
      ogg: p("content/speech.ogg"),
      m4a: p("content/speech.m4a"),
      aac: p("content/speech.aac"),
      opus: p("content/speech.opus"),
    },
    music: { wav: p("content/media-30s.wav") },
    tagged: p("content/audio-with-tags.mp3"),
    stereo: p("media/tone-stereo.wav"),
    gap: p("media/tone-gap.wav"),
    tiny: (ext: string) => p(`media/tiny.${ext}`),
    hostileEmpty: { zeroByte: p("hostile/zero-byte.wav") },
  },
  document: {
    pdfMulti: p("content/multipage-6.pdf"),
    pdf2: p("content/alt-2page.pdf"),
    pdf3: p("test-3page.pdf"),
    pdfScanned: p("content/ocr-scanned.pdf"),
    encrypted: p("documents/encrypted.pdf"),
    tiny: (ext: string) => p(`documents/tiny.${ext}`),
    remoteImgHtml: p("documents/remote-img.html"),
    hostile: { truncatedDocx: p("hostile/truncated.docx"), garbagePdf: p("hostile/garbage.pdf") },
  },
  data: {
    csv: p("data/tiny.csv"),
    csvA: p("data/tiny-a.csv"),
    csvB: p("data/tiny-b.csv"),
    json: p("data/tiny.json"),
    xml: p("data/tiny.xml"),
    yaml: p("data/tiny.yaml"),
    tsv: p("data/tiny.tsv"),
    zip: p("data/tiny.zip"),
  },
  security: {
    svgXxeFile: p("security/svg-xxe-file-read.svg"),
    svgXxeSsrf: p("security/svg-xxe-ssrf.svg"),
    polyglot: p("hostile/png-bytes.jpg"),
    htmlSsrf: p("documents/remote-img.html"),
  },
} as const;

export function readFixture(path: string): Buffer {
  return readFileSync(path);
}

// Recursively collect every string-valued leaf, EXCLUDING `*hostileEmpty*` groups
// (intentionally zero-byte) and function leaves (the `formats`/`tiny` accessors).
export function flattenFixturePaths(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) =>
      k.toLowerCase().includes("hostileempty") ? [] : flattenFixturePaths(v),
    );
  }
  return []; // functions (accessors) and other non-leaves
}
