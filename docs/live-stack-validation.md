# Live Stack Validation

`npm test` validates the release artifacts without starting the full CMS dependency graph.

Use `npm run verify:live` when you need proof that Websight CMS can run as a real Service Lasso consumer stack.

## Required Local Repos

The live verifier uses the sibling Service Lasso core repo so it can call the same lifecycle code used by the CLI:

```powershell
$env:SERVICE_LASSO_REPO = "C:\projects\service-lasso\service-lasso"
npm run verify:live
```

If `SERVICE_LASSO_REPO` is not set, the verifier defaults to `..\service-lasso` relative to this repo.

## Stack Under Test

The verifier creates a clean consumer workspace under `output/live-stack/<platform>` and writes service manifests for:

- `@java`
- `@node`
- `mongo`
- `nginx`
- `totaljs-messageservice`
- `totaljs-flow`
- `websight-cms`

Runtime archives, extracted services, logs, MongoDB data, and CMS repository state stay under that generated `output/` workspace.

## Proof Collected

The live verifier checks:

- the stack installs, configures, and starts through Service Lasso lifecycle orchestration;
- `websight-cms` runs through `execservice: "@java"` and records `@java` as the provider service;
- `GET /system/health` returns `200`;
- the exported root and login URL shapes resolve from the negotiated CMS service port;
- Websight CMS can restart and return to healthy;
- Websight CMS can stop cleanly before the remaining dependency services are stopped.

This script is intentionally not part of release CI because it downloads and starts a full Java/MongoDB/NGINX/Total.js/CMS stack.
