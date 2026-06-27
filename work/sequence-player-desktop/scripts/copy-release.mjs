import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const outputsRoot = resolve(workspaceRoot, "outputs");
const sourceDir = resolve(outputsRoot, "sequence-player");

const githubSource = resolve(packageRoot, "dist", "github");
const itchSource = resolve(packageRoot, "dist", "itch");
const githubOut = resolve(outputsRoot, "github");
const itchOut = resolve(outputsRoot, "itch build");

function resetDir(dir) {
  rmSync(dir, { force: true, recursive: true });
  mkdirSync(dir, { recursive: true });
}

function findArtifact(dir, test) {
  if (!existsSync(dir)) {
    throw new Error(`Missing build output: ${dir}`);
  }
  const match = readdirSync(dir).find(test);
  if (!match) {
    throw new Error(`No matching artifact in ${dir}`);
  }
  return join(dir, match);
}

resetDir(githubOut);
resetDir(itchOut);

const githubExe = findArtifact(
  githubSource,
  (name) => name.endsWith(".exe") && name.toLowerCase().includes("portable"),
);
const itchSetup = findArtifact(
  itchSource,
  (name) => name.endsWith(".exe") && name.toLowerCase().includes("setup"),
);

copyFileSync(githubExe, join(githubOut, "Sequence-Player-portable.exe"));
copyFileSync(itchSetup, join(itchOut, "Sequence-Player-Setup.exe"));

for (const file of [
  "README.md",
  "AI.md",
  "llms.txt",
  "app.manifest.json",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
]) {
  const source = join(sourceDir, file);
  if (existsSync(source)) {
    copyFileSync(source, join(githubOut, file));
  }
}

for (const dir of ["assets", "metadata"]) {
  const source = join(sourceDir, dir);
  if (existsSync(source)) {
    cpSync(source, join(githubOut, dir), { recursive: true });
  }
}

console.log(`github exe -> ${join(githubOut, "Sequence-Player-portable.exe")}`);
console.log(`github metadata -> ${githubOut}`);
console.log(`itch setup -> ${join(itchOut, "Sequence-Player-Setup.exe")}`);
