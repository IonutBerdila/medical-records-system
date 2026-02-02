# Medical Records Backend

ASP.NET Core 8.0 Web API with Clean Architecture.

## Prerequisites

- .NET 8.0 SDK
- Docker (for PostgreSQL)
- Entity Framework Core tools (`dotnet tool install --global dotnet-ef`)

## Quick Start

### 1. Start the Database

```bash
cd ..\infra
docker compose up -d
```

### 2. Restore and Build

```bash
cd ..\backend
dotnet restore
dotnet build
```

### 3. Create Initial Migration

```bash
dotnet ef migrations add InitialIdentity --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api
```

### 4. Apply Migration to Database

```bash
dotnet ef database update --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api
```

### 5. Run the API

```bash
cd src\MedicalRecords.Api
dotnet run
```

### 6. Access the API

- **Swagger UI**: http://localhost:5000/swagger (or check console for actual port)
- **Health Check**: http://localhost:5000/api/health

## Project Structure

```
backend/
├── MedicalRecords.sln
└── src/
    ├── MedicalRecords.Api/          # ASP.NET Core Web API
    ├── MedicalRecords.Application/  # Application layer (use cases)
    ├── MedicalRecords.Domain/       # Domain entities
    └── MedicalRecords.Infrastructure/ # Data access, EF Core
```

## Configuration

Connection string and JWT settings are in `appsettings.Development.json`.
