# Infrastructure

## PostgreSQL Database (Docker)

### Start the database

```bash
docker compose up -d
```

### Stop the database

```bash
docker compose down
```

### View logs

```bash
docker compose logs -f postgres
```

### Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: medicaldb
- **Username**: medicaluser
- **Password**: medicalpass

### Health Check

The PostgreSQL container includes a health check that verifies the database is ready to accept connections using `pg_isready`.

To check container health:

```bash
docker compose ps
```
