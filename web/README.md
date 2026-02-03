# Med Card Web UI (Phase 2.5)

Interfață web minimală pentru sistemul `medical-records-system`, inspirată de aplicațiile mobile. Pentru testarea rapidă a fluxurilor de autentificare și roluri peste backend-ul existent.

## Tech stack

- React + TypeScript + Vite
- React Router
- Axios
- TailwindCSS
- react-hot-toast (feedback vizual)

## Setup

1. Din directorul `web/`, instalează dependențele:

```bash
npm install
```

2. Configure a variabilelor de mediu:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` pointează către API-ul backend. Portul corect din:

- `backend/src/MedicalRecords.Api/Properties/launchSettings.json` (`applicationUrl`) sau
- consola `dotnet run` (mesajul „Now listening on: ...”)

Exemplu:

```env
VITE_API_BASE_URL=http://localhost:5000
```

3. Rulează aplicația în modul development:

```bash
npm run dev
```

Aplicația va porni pe `http://localhost:5173`.

## Rute principale

- `/` – Splash (redirect automat către `/auth`)
- `/auth` – ecran intermediar cu butoane **Sign Up** / **Log In**
- `/login` – formular de autentificare
- `/signup` – pasul 1 de înregistrare (apelează `POST /api/auth/register`)
- `/signup/extra` – pasul 2 cosmetic (profil, salvat doar în `localStorage`)
- `/dashboard` – dashboard protejat (în funcție de rol)
- `/me` – pagină protejată cu detalii despre utilizator + JSON de debug

## Integrare API

Aplicația folosește endpoint din backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
