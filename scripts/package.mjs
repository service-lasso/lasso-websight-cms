import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serviceVersion = process.env.WEBSIGHT_CMS_SERVICE_VERSION ?? "1.0.0";
const targetPlatform = process.env.TARGET_PLATFORM ?? process.platform;

const targets = {
  win32: { archiveType: "zip" },
  linux: { archiveType: "tar.gz" },
  darwin: { archiveType: "tar.gz" },
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}: ${result.error?.message ?? ""}`);
  }
}

function versionedAssetName(version, platform, archiveType) {
  return `lasso-websight-cms-${version}-${platform}.${archiveType === "zip" ? "zip" : "tar.gz"}`;
}

async function compressPackage(packageRoot, outputPath, archiveType) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });

  if (archiveType === "zip") {
    run("powershell", [
      "-NoLogo",
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path ${JSON.stringify(path.join(packageRoot, "*"))} -DestinationPath ${JSON.stringify(outputPath)} -Force`,
    ]);
    return outputPath;
  }

  run("tar", ["-czf", outputPath, "-C", packageRoot, "."]);
  return outputPath;
}

function assertVendorConfig() {
  const configRoot = path.join(repoRoot, "vendor", "config");
  const launcher = path.join(configRoot, "org.apache.sling.feature.launcher.jar");
  const webSightFeature = path.join(
    configRoot,
    "cache",
    "ai",
    "typerefinery",
    "websight",
    "typerefinery-distribution",
    "1.0.0-SNAPSHOT",
    "typerefinery-distribution-1.0.0-SNAPSHOT-typerefinery-websight.slingosgifeature",
  );
  const dockerFeature = path.join(
    configRoot,
    "cache",
    "ai",
    "typerefinery",
    "websight",
    "typerefinery-distribution",
    "1.0.0-SNAPSHOT",
    "typerefinery-distribution-1.0.0-SNAPSHOT-docker.slingosgifeature",
  );

  for (const requiredPath of [launcher, webSightFeature, dockerFeature]) {
    if (!existsSync(requiredPath)) {
      throw new Error(`Required Websight CMS package input missing: ${requiredPath}`);
    }
  }

  return configRoot;
}

export async function packageWebsightCms(platform = targetPlatform, version = serviceVersion) {
  const target = targets[platform];
  if (!target) {
    throw new Error(`Unsupported target platform: ${platform}. Supported platforms: ${Object.keys(targets).join(", ")}.`);
  }

  const configRoot = assertVendorConfig();
  const outputRoot = path.join(repoRoot, "output", "package", version, platform);
  const packageRoot = path.join(outputRoot, "payload");
  const outputPath = path.join(repoRoot, "dist", versionedAssetName(version, platform, target.archiveType));

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(packageRoot, { recursive: true });
  await cp(configRoot, path.join(packageRoot, "config"), { recursive: true });
  await writeFile(
    path.join(packageRoot, "SERVICE-LASSO-PACKAGE.json"),
    `${JSON.stringify(
      {
        serviceId: "websight-cms",
        version,
        platform,
        arch: "x64",
        packagedBy: "service-lasso/lasso-websight-cms",
        runtimeProvider: "@java",
        dependencies: ["@java", "mongo", "nginx", "totaljs-flow", "totaljs-messageservice"],
        excludes: ["server/** runtime state", "logs/**", "repository/**"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await compressPackage(packageRoot, outputPath, target.archiveType);
  console.log(`[lasso-websight-cms] packaged ${outputPath}`);
  return outputPath;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await packageWebsightCms();
}
