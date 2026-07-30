import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

await cp(
  path.join(root, "src", "resources", "stages"),
  path.join(root, "dist", "resources", "stages"),
  { recursive: true }
);

console.log("Copied stage resource markdown into dist/.");
