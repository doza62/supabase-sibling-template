# Supabase Sibling Template

Sibling Supabase stack for Coolify. Shares Postgres, MinIO, and Analytics with a hub stack. Each new project deploys as a separate Coolify service with its own Kong, Auth, REST, Realtime, Storage, Studio, and Edge Functions.

## Architecture

```
Hub (supabase-mobile-apps)
├── Postgres (shared — multiple databases)
├── MinIO (shared — multiple buckets)
├── Analytics (shared)
└── Its own Kong/Studio/Auth/REST/etc.

Sibling (supabase-aida)
├── Kong (own FQDN)
├── Studio (own URL via SERVICE_URL_SUPABASESTUDIO_3000)
├── Auth (own users)
├── REST (points at hub PG / database=aida)
├── Realtime (own tenant)
├── Storage (own buckets in shared MinIO)
├── Edge Functions (own folder)
└── NO Postgres / MinIO / Analytics (uses hub's)

Sibling (supabase-onepm)
└── same pattern, database=onepm
```

## Deploy a New Sibling

### 1. Coolify → New Resource → Public Git Repository

Paste this repo URL. Select `main` branch.

### 2. Set Service-Specific Configuration (Coolify auto-surfaces)

- Supabase Dashboard User: e.g., `aida_admin`
- Supabase Dashboard Password: new random per sibling
- MinIO Admin User: copy from hub
- MinIO Admin Password: copy from hub

### 3. Set Environment Variables

Use the [Config Helper](https://R0dri.github.io/supabase-sibling-template/) to generate the env block.

Or manually, set in Coolify Environment tab:

```env
# Hub hostnames (find via: docker ps --format '{{.Names}}' | grep mobile-apps)
POSTGRES_HOSTNAME=supabase-mobile-apps-<uuid>-db
MINIO_HOSTNAME=supabase-mobile-apps-<uuid>-minio
ANALYTICS_HOSTNAME=supabase-mobile-apps-<uuid>-analytics

# Per-sibling identity
POSTGRES_DB=aida
STUDIO_DEFAULT_PROJECT=Aida
STORAGE_TENANT_ID=aida
API_EXTERNAL_URL=https://api.aida.5sites.co
GOTRUE_SITE_URL=https://app.aida.5sites.co

# Shared secrets (copy from hub)
SERVICE_PASSWORD_POSTGRES=
SERVICE_PASSWORD_JWT=
SERVICE_SUPABASEANON_KEY=
SERVICE_SUPABASESERVICE_KEY=
SERVICE_PASSWORD_PGMETACRYPTO=
SERVICE_PASSWORD_LOGFLARE=
SERVICE_PASSWORD_LOGFLAREPRIVATE=
SECRET_PASSWORD_REALTIME=
```

### 4. Enable Connect to Predefined Network

Both hub AND sibling services must have this enabled in Coolify service settings.

### 5. Create the Database in Hub

```bash
docker exec supabase-mobile-apps-db psql -U postgres -c "CREATE DATABASE aida;"
```

### 6. Set Kong FQDN

In Coolify → Service → `supabase-kong` → Domains → set FQDN (e.g., `https://api.aida.5sites.co`).

### 7. Deploy

Containers start, services auto-migrate schemas into the new database, Kong routes traffic, Studio accessible at assigned FQDN.

## Config Helper

A client-side web app at [GitHub Pages](https://R0dri.github.io/supabase-sibling-template/) helps generate env blocks. Paste hub's env vars, fill per-sibling values, copy generated block to Coolify. Data stays in browser localStorage — no server, no tracking.

## Volume Layout

```
volumes/
├── api/
│   ├── kong-entrypoint.sh   # Kong entrypoint (variable substitution + awk)
│   └── kong.yml              # Kong declarative routing config
├── functions/
│   ├── main/index.ts         # Edge Functions default main
│   └── hello/index.ts        # Edge Functions example
├── snippets/                 # Studio SQL snippets (auto-created)
├── storage/                  # Storage API files (auto-created)
└── studio-data/              # Studio data (auto-created)
```

## Adding More Siblings

1. Create database: `CREATE DATABASE <name>;`
2. Coolify → New Service → pick this repo
3. Run through Config Helper with new sibling values
4. Deploy

## Updating

```bash
git pull
# Coolify auto-redeploys on push
```
