# URL Contracts

## UI

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Websight CMS root |
| `GET` | `/apps/websight-authentication/login.html` | Websight CMS login |

## API And Health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/system/health` | Service Lasso HTTP healthcheck |

## Runtime State

Runtime data is rooted under `${SERVICE_ROOT}/server`:

- `${SERVICE_ROOT}/server/data`
- `${SERVICE_ROOT}/server/data/docroot`
- `${SERVICE_ROOT}/server/home`
