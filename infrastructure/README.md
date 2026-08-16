# Real-Time Collaboration Platform — Infrastructure

## Starting the Database

```bash
# From the repository root
cd infrastructure

# Copy env (first time only)
cp ../.env.example ../.env

# Start PostgreSQL
docker compose up -d postgres

# Check health
docker compose ps

# Optional: Start pgAdmin UI (http://localhost:5050)
docker compose --profile tools up -d pgadmin
```

## Stopping

```bash
docker compose down          # stop containers, keep volumes
docker compose down -v       # stop containers AND delete volumes (reset DB)
```

## Connecting Manually

```bash
docker exec -it collab_postgres psql -U collab_user -d collab_db
```

## Environment Variables

All variables are defined in `../.env.example`. Copy to `../.env` and fill in secrets before running.

## Future Services

The `docker-compose.yml` has commented placeholders for:
- Redis (Pub/Sub for Phase 2)
- Additional worker services
