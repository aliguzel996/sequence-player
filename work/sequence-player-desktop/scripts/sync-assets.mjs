import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const sourceDir = resolve(workspaceRoot, "outputs", "sequence-player");
const appDir = resolve(packageRoot, "app");
const webDir = resolve(workspaceRoot, "outputs", "web");

if (!existsSync(sourceDir)) {
  throw new Error(`Missing source app: ${sourceDir}`);
}

for (const target of [appDir, webDir]) {
  rmSync(target, { force: true, recursive: true });
  mkdirSync(target, { recursive: true });
  cpSync(sourceDir, target, { recursive: true });
}

console.log(`synced app -> ${appDir}`);
console.log(`synced web -> ${webDir}`);
