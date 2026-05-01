# Release Suitability

## Included

The release package includes only the Websight CMS launcher inputs under `vendor/config`:

- Apache Sling feature launcher jar
- Maven-style feature/bundle cache
- bundled launch scripts retained for upstream reference

## Excluded

The source `server/` folder is intentionally excluded. It contains runtime repository data, generated state, and logs. Service Lasso creates clean app-owned runtime folders under the consumer workspace instead.

## Dependency Readiness

The manifest declares these dependencies explicitly:

- `@java`
- `mongo`
- `nginx`
- `totaljs-flow`
- `totaljs-messageservice`

Consumers must include those service manifests in their `services/` folder when using Websight CMS.

## Licensing Review Notes

The bundled launcher scripts carry Apache License headers. The package verifier checks that release artifacts contain no persisted server state/logs and that no bundled source file exceeds GitHub's single-file release suitability limits.

Websight CMS is a Java-based Apache Sling application delivered as a Sling Feature Model, according to the public [WebSight CMS architecture documentation](https://docs.websight.io/cms/architecture/). The packaged cache is the concrete feature/bundle input required by this service. If the project later switches to building Websight from Maven source instead of vendoring the prepared cache, this document and release verification should be updated.
