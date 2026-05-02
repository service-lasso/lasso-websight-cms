# lasso-websight-cms

Release-backed Websight CMS package for Service Lasso.

This repo packages the Websight CMS Sling launcher inputs into Service Lasso artifacts. It deliberately excludes persisted server state, repository data, and logs.

## What It Packages

- `vendor/config/org.apache.sling.feature.launcher.jar`
- `vendor/config/cache/**` Maven-style Sling/Websight feature cache
- Service Lasso manifest and release packaging metadata

Release artifacts are:

- `lasso-websight-cms-1.0.0-win32.zip`
- `lasso-websight-cms-1.0.0-linux.tar.gz`
- `lasso-websight-cms-1.0.0-darwin.tar.gz`
- `service.json`
- `SHA256SUMS.txt`

## Runtime Contract

- Service id: `websight-cms`
- Main port: `8113`
- Debug port: `8115`
- Runtime provider: `@java`
- Dependencies: `@java`, `mongo`, `nginx`, `totaljs-flow`, `totaljs-messageservice`
- Data path: `server/data`
- HTTP healthcheck: `GET /system/health`

The service exports:

- `CMS_PORT`
- `CMS_DEBUG_PORT`
- `CMS_URL`
- `CMS_URL_AUTH`
- `CMS_CACHE_PATH_ESC`

## Local Verification

```powershell
npm install
npm test
```

The default verifier builds all release archives and validates the manifest, package metadata, bundled config, feature files, dependency list, ports, environment contract, and release suitability constraints.

Live start validation is intentionally separate because Websight CMS requires running Java, MongoDB, NGINX, Total.js Flow, and Total.js Message Service services together:

```powershell
$env:SERVICE_LASSO_REPO = "C:\projects\service-lasso\service-lasso"
npm run verify:live
```

The live verifier creates a consumer-style workspace under `output/live-stack/<platform>`, installs/configures/starts the full stack through Service Lasso lifecycle code, checks the exported CMS health/root/login URLs, restarts Websight CMS, stops it, and then stops the remaining services.

See [docs/live-stack-validation.md](docs/live-stack-validation.md).

## Licensing And Release Suitability

See [docs/release-suitability.md](docs/release-suitability.md).
