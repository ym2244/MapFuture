# MapFuture

An interactive travel-planning SPA built with React (Vite), backed by:

* a **React** frontend
* a **FastAPI**-based AI backend (Groq LLM)
* a **JSON server** (cities data)

This README covers:

- [MapFuture](#mapfuture)
  - [Deployed URLs](#deployed-urls)
  - [1. Clone](#1-clone)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Local Development (without Docker)](#3-local-development-without-docker)
    - [3.1 JSON Server](#31-json-server)
    - [3.2 AI Backend](#32-ai-backend)
    - [3.3 Frontend](#33-frontend)
  - [4. Docker \& Docker-Compose](#4-docker--docker-compose)
  - [5. Production Build](#5-production-build)
    - [Frontend](#frontend)
    - [AI Backend \& JSON Server](#ai-backend--json-server)

---

## Deployed URLs

* **Frontend (MapFuture)**: [https://mapfuture.onrender.com](https://mapfuture.onrender.com)
* **AI Backend**: [https://mapfuture-backend.onrender.com](https://mapfuture-backend.onrender.com)
* **JSON Server API**: [https://map-future-json-api.onrender.com](https://map-future-json-api.onrender.com)

---

## 1. Clone

```bash
cd /path/to/your/code
git clone https://github.com/ym2244/MapFuture.git
cd MapFuture
```

---

## 2. Environment Variables

Create a `.env` file in the project root (e.g. `D:/vscode/2A/MapFuture_SPA/.env`) with the following content:

```dotenv
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
VITE_CITIES_API=https://map-future-json-api.onrender.com
VITE_AI_API=https://mapfuture-backend.onrender.com
```

Then ensure your `.gitignore` includes:

```gitignore
*.env
infile.*
```

---

## 3. Local Development (without Docker)

### 3.1 JSON Server

```bash
cd data
npm install -g json-server       # if you haven’t already
json-server --watch cities.json \
            --port 9000 \
            --host 0.0.0.0
# now listening on http://localhost:9000
```

### 3.2 AI Backend

```bash
cd ../src/AI
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

uvicorn travel_plan_api:app \
        --reload \
        --host 0.0.0.0 \
        --port 8000
# now listening on http://localhost:8000
```

### 3.3 Frontend

```bash
cd ../../            # back to project root
npm install
npm run dev -- --host 0.0.0.0
# open http://localhost:5173
```

---

## 4. Docker & Docker-Compose

You can run all three services in containers.

1. **Build & start**

   ```bash
   docker-compose up --build
   ```

2. **Ports**  
   - JSON Server → `localhost:9000`  
   - AI Backend → `localhost:8000`  
   - Frontend → `localhost:5173`

3. **Tear down**  
   ```bash
   docker-compose down
   ```

The `docker-compose.yml` references three Dockerfiles:

* `data/Dockerfile`        ← JSON server
* `src/AI/Dockerfile`      ← Python AI backend
* `Dockerfile.frontend`    ← Vite frontend

---

## 5. Production Build

### Frontend

```bash
npm run build
# outputs to dist/
```

Host `dist/` on any static server (Netlify, Vercel, S3, Nginx…).

### AI Backend & JSON Server

Can be dockerized (see Dockerfiles) or deployed to any Python/Node host. Be sure to set your env vars (GROQ\_API\_KEY, VITE\_\* URLs) in your hosting dashboard.

---

Happy coding!
