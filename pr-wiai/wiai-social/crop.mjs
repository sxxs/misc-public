// crop.mjs — crops 1080x1920 PNG to 1080x1350 (centered vertically) for Instagram carousel
import sharp from "sharp";
import { resolve } from "path";

const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node crop.mjs <input.png> <output.png>");
  process.exit(1);
}

const INPUT_HEIGHT = 1920;
const OUTPUT_HEIGHT = 1350;
const INPUT_WIDTH = 1080;
const topOffset = Math.floor((INPUT_HEIGHT - OUTPUT_HEIGHT) / 2); // 285px

await sharp(resolve(inputPath))
  .extract({ left: 0, top: topOffset, width: INPUT_WIDTH, height: OUTPUT_HEIGHT })
  .png({ compressionLevel: 9 })
  .toFile(resolve(outputPath));

console.log(`Cropped → ${outputPath}`);
