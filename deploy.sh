#!/bin/bash
# Redeploy influ-app-frontend to the VPS (Docker + Apache reverse proxy).
#
# Deploy model: rsync the source to the VPS, then build the Docker image ON the
# server and (re)start the container. Build happens on the server so the
# NEXT_PUBLIC_API_URL below is baked into the client bundle at build time
# (NEXT_PUBLIC_* vars cannot be injected at `docker run` time).
#
# The container is published to 127.0.0.1 only; Apache (app.inflique.com) is the
# public door. Port 3000 on the host is taken by another service, so we use 3200.
set -euo pipefail

VPS=root@80.241.213.128
REMOTE_DIR=/opt/influ-app-frontend
API_URL=https://influ-app-backend.onrender.com
HOST_PORT=3200

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Syncing source to $VPS:$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude '.env*' \
  "$SCRIPT_DIR/" "$VPS:$REMOTE_DIR/"

echo "==> Building image on the VPS (NEXT_PUBLIC_API_URL=$API_URL)"
ssh "$VPS" "cd $REMOTE_DIR && docker build --build-arg NEXT_PUBLIC_API_URL=$API_URL -t influ-app-frontend ."

echo "==> Restarting container"
ssh "$VPS" "docker stop influ-app-frontend 2>/dev/null || true; docker rm influ-app-frontend 2>/dev/null || true"
ssh "$VPS" "docker run -d --name influ-app-frontend --restart unless-stopped -p 127.0.0.1:$HOST_PORT:3000 influ-app-frontend"

echo "==> Health check (internal)"
ssh "$VPS" "sleep 2 && curl -sI http://127.0.0.1:$HOST_PORT | head -3"
echo "==> Done. Public URL: https://app.inflique.com"
