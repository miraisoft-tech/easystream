# Deploying WorshipPresenter Studio on Coolify

This guide explains how to deploy **WorshipPresenter Studio** to [Coolify](https://coolify.io/) using **Nixpacks** (recommended), **Dockerfile**, or **Docker Compose**.

---

## ⚡ Quick Deployment in Coolify

### Option 1: Deploy with Nixpacks (Recommended)

Nixpacks builds a fast, lightweight container automatically from your source tree using the included [`nixpacks.toml`](./nixpacks.toml).

1. Open your **Coolify Dashboard**.
2. Navigate to **Projects** → Select your environment → Click **+ New Resource**.
3. Choose **Public Repository** or **Private Repository** (GitHub / GitLab / Gitea) and select your repository.
4. Under **Build Pack**, select **Nixpacks**.
5. Coolify will detect [`nixpacks.toml`](./nixpacks.toml) and auto-configure the Node 22 runtime:
   - **Install Phase**: `npm ci`
   - **Build Phase**: `npm run build`
   - **Start Command**: `node server.js`
6. Under application configuration, set:
   - **Ports Exposes**: `3000`
   - **Base Directory**: `/`
7. (Crucial) Add a persistent storage volume for your songs and library (see [Persistent Storage](#-persistent-storage-important) below).
8. Click **Deploy**.

---

### Option 2: Deploy with Dockerfile

1. Open your **Coolify Dashboard**.
2. Navigate to **Projects** → Select your environment → Click **+ New Resource**.
3. Select your repository.
4. Under **Build Pack**, select **Dockerfile**.
5. Coolify will automatically detect the multi-stage [`Dockerfile`](./Dockerfile).
6. Configure the following settings:
   - **Ports Exposes**: `3000`
   - **Base Directory**: `/`
7. Click **Deploy**.

---

### Option 3: Deploy with Docker Compose

1. Open your **Coolify Dashboard**.
2. Go to your Project & Environment → Click **+ New Resource** → **Docker Compose**.
3. Select your Git repository or paste the contents of [`docker-compose.yml`](./docker-compose.yml).
4. Click **Save** and **Deploy**.

---

## 💾 Persistent Storage (Important!)

WorshipPresenter saves songs, themes, service schedules, and presentation settings to `/app/data/store.json`.

To make sure your data is never lost when the container updates or redeploys:

1. In Coolify, open your application settings.
2. Go to the **Storages** tab.
3. Click **Add Storage / Persistent Volume**:
   - **Volume Name**: `worshippresenter_data` (or any name)
   - **Destination Path**: `/app/data`
4. Click **Save** and redeploy the container.

> **Note**: If deploying via `docker-compose.yml`, the `easystream_data` volume is already mapped to `/app/data` automatically.

---

## ⚙️ Environment Variables

You can configure these in Coolify's **Environment Variables** tab:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port the HTTP and WebSocket server listens on inside the container |
| `NODE_ENV` | `production` | Node.js production mode |
| `DATA_DIR` | `/app/data` | Custom directory path for library and state storage (defaults to `./data`) |
| `NIXPACKS_NODE_VERSION` | `22` | Node.js version used by Nixpacks |

---

## 🌐 Endpoints & URLs

Once your domain is attached (e.g. `https://worship.yourdomain.com`):

- **Control Studio Console**: `https://worship.yourdomain.com/`
- **Sanctuary Projector Screen**: `https://worship.yourdomain.com/display`
- **vMix / OBS Alpha Overlay**: `https://worship.yourdomain.com/display?overlay=1`
- **Stage Confidence Monitor**: `https://worship.yourdomain.com/stage`
- **Health Check Endpoint**: `https://worship.yourdomain.com/health`

---

## 🔌 WebSocket & Reverse Proxy Details

- WebSocket connections connect to `/ws` on the same host and port.
- Coolify’s built-in reverse proxies (Traefik or Caddy) automatically proxy WebSocket connections (`Upgrade` and `Connection` headers) out of the box with zero extra configuration needed.
