# Database Management Commands

## Overview

All database commands now use `simplia_paas` as the single database for both development and testing.

## Available Commands

### Create Database
```bash
npm run db:create
```
Creates the `simplia_paas` database if it doesn't exist.
- Idempotent (safe to run multiple times)
- Sets owner to `DATABASE_USER` from `.env`
- Uses UTF-8 encoding

### Drop Database
```bash
npm run db:drop
```
**⚠️ DANGER:** Completely drops the `simplia_paas` database and all tenant schemas.
- Terminates all active connections
- Drops all tenant schemas (tenant_*)
- Deletes ALL data permanently

### Reset Database
```bash
npm run db:reset
```
Complete database reset in one command:
1. Drops database (`npm run db:drop`)
2. Creates fresh database (`npm run db:create`)
3. Runs all migrations (`npm run migrate`)

**Use case:** Start fresh with clean database and schema

### Run Migrations
```bash
npm run migrate
```
Runs all pending migrations from `src/server/infra/migrations/`
- Tracks executed migrations in `migrations` table
- Idempotent (skips already executed migrations)
- Safe to run multiple times

## Common Workflows

### First Time Setup
```bash
# 1. Ensure Docker PostgreSQL is running
docker-compose up -d

# 2. Create database
npm run db:create

# 3. Run migrations
npm run migrate

# 4. Start development server
npm run dev
```

### Reset Everything (Clean Slate)
```bash
# All in one command
npm run db:reset

# Or step by step
npm run db:drop
npm run db:create
npm run migrate
```

### Before Running Tests
```bash
# Tests automatically run db:create via pretest hook
npm test

# Or manually
npm run db:create
npm test
```

### After Pulling New Code
```bash
# Just run migrations (database already exists)
npm run migrate
```

## Environment Variables

Commands use these variables from `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simplia_paas      # Main database
DATABASE_USER=postgres
DATABASE_PASSWORD=1234
```

## Docker Configuration

The PostgreSQL container is configured in `docker-compose.yml`:

```yaml
environment:
  POSTGRES_DB: simplia_paas      # Must match DATABASE_NAME
  POSTGRES_USER: postgres        # Must match DATABASE_USER
  POSTGRES_PASSWORD: 1234        # Must match DATABASE_PASSWORD
  PGTZ: UTC                      # Force UTC timezone
  TZ: UTC                        # Container timezone
```

## Troubleshooting

### Database Already Exists
```
[db:create] Database 'simplia_paas' already exists — ok
```
This is normal and safe. The command is idempotent.

### Cannot Connect
```
[db:create] ⚠️  PostgreSQL is not running or inaccessible
```
**Solution:**
1. Check Docker container is running: `docker ps`
2. Start container: `docker-compose up -d`
3. Verify connection: `docker-compose exec postgres psql -U postgres`

### Permission Denied
```
[db:create] Warning: could not alter OWNER
```
This warning is usually harmless. The database was created successfully.

### Database In Use (Cannot Drop)
```
ERROR: database "simplia_paas" is being accessed by other users
```
**Solution:**
1. Stop all servers (`Ctrl+C` on dev servers)
2. Close all DBeaver/pgAdmin connections
3. Try again: `npm run db:drop`

## Migration Files

Location: `src/server/infra/migrations/`

Naming convention: `NNN_description.sql`

Example:
```
001_create_core_tables.sql
002_create_branding_tables.sql
003_seed_initial_data.sql
```

## Safety Notes

⚠️ **Production:**
- NEVER run `db:drop` or `db:reset` in production
- Always backup before migrations
- Test migrations locally first

✅ **Development:**
- Safe to drop/reset anytime
- Use `db:reset` for clean slate
- Migrations are idempotent

---

**Last Updated:** 2025-10-10
**Related Docs:**
- [Timezone Management](./timezone-management.md)
- [Timezone Implementation](./timezone-i18n-implementation.md)
