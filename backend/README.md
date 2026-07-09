# Blog Admin Backend

FastAPI backend for the personal wiki/blog admin system.

## Local Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

Alembic:

```powershell
alembic upgrade head
```

Admin auth:

- Initial admin is created on app startup when the `admins` table is empty.
- Configure it with `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` in `.env`.
- Login: `POST /api/admin/login`
- Current admin: `GET /api/admin/me`
- Change password: `POST /api/admin/change-password`
- Logout: `POST /api/admin/logout`
