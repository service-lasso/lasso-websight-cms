import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packageWebsightCms } from "./package.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.env.WEBSIGHT_CMS_SERVICE_VERSION ?? "1.0.0";
const platforms = (process.env.TARGET_PLATFORM ? [process.env.TARGET_PLATFORM] : ["win32", "linux", "darwin"]);
const requiredDependencies = ["@java", "mongo", "nginx", "totaljs-flow", "totaljs-messageservice"];
const maxSingleFileBytes = 100 * 1024 * 1024;

async function walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const manifest = JSON.parse(await readFile(path.join(repoRoot, "service.json"), "utf8"));
assert(manifest.id === "websight-cms", `Unexpected service id: ${manifest.id}`);
assert(manifest.execservice === "@java", "Websight CMS must execute through @java.");
assert(manifest.ports?.service === 8113, "Service port must default to 8113.");
assert(manifest.ports?.debug === 8115, "Debug port must default to 8115.");
assert(manifest.healthcheck?.type === "http", "Healthcheck must be HTTP.");
assert(manifest.healthcheck?.url?.includes("/system/health"), "Healthcheck must target /system/health.");
for (const dependency of requiredDependencies) {
  assert(manifest.depend_on?.includes(dependency), `Missing dependency: ${dependency}`);
}
for (const globalName of ["CMS_PORT", "CMS_DEBUG_PORT", "CMS_URL", "CMS_URL_AUTH", "CMS_CACHE_PATH_ESC"]) {
  assert(manifest.globalenv?.[globalName], `Missing globalenv output: ${globalName}`);
}
for (const platform of platforms) {
  assert(manifest.commandline?.[platform]?.includes("org.apache.sling.feature.launcher.jar"), `Missing launcher jar commandline for ${platform}.`);
  assert(manifest.commandline?.[platform]?.includes("typerefinery-distribution-1.0.0-SNAPSHOT-typerefinery-websight.slingosgifeature"), `Missing Websight feature in ${platform} commandline.`);
  assert(manifest.artifact?.platforms?.[platform], `Missing artifact platform entry: ${platform}`);
}

const vendorConfig = path.join(repoRoot, "vendor", "config");
assert(existsSync(path.join(vendorConfig, "org.apache.sling.feature.launcher.jar")), "Missing Sling feature launcher jar.");
assert(existsSync(path.join(vendorConfig, "cache")), "Missing Websight feature cache.");

const vendorFiles = await walkFiles(vendorConfig);
assert(vendorFiles.length > 0, "Vendor config must contain files.");
for (const file of vendorFiles) {
  const info = await stat(file);
  assert(info.size <= maxSingleFileBytes, `File exceeds ${maxSingleFileBytes} byte limit: ${file}`);
  assert(!file.includes(`${path.sep}server${path.sep}`), `Runtime server state must not be packaged: ${file}`);
}

const extensions = new Set(vendorFiles.map((file) => path.extname(file).toLowerCase()));
for (const requiredExtension of [".jar", ".slingosgifeature"]) {
  assert(extensions.has(requiredExtension), `Vendor config missing ${requiredExtension} files.`);
}

const artifacts = [];
for (const platform of platforms) {
  const artifact = await packageWebsightCms(platform, version);
  artifacts.push(artifact);
  const info = await stat(artifact);
  assert(info.size > 0, `Artifact is empty: ${artifact}`);
}

const checksums = await Promise.all(artifacts.map(async (artifact) => {
  const hash = createHash("sha256").update(await readFile(artifact)).digest("hex");
  return `${hash}  ${path.basename(artifact)}`;
}));

console.log(`[lasso-websight-cms] verified manifest and packaged ${artifacts.length} artifact(s)`);
console.log(checksums.join("\n"));
