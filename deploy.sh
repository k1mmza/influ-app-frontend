#!/bin/bash
# Redeploy influ-app-frontend to the VPS (Docker + Apache reverse proxy).
#
# Deploy model: the VPS holds a git clone of this repo. Each deploy pulls the
# latest main, builds the Docker image ON the server, and (re)starts the
# container. Build happens on the server so NEXT_PUBLIC_API_URL is baked into the
# client bundle at build time (NEXT_PUBLIC_* vars cannot be injected at
# `docker run` time).
#
# Push your changes to origin/main first, then run this script.
#
# The container is published to 127.0.0.1 only; Apache (app.inflique.com) is the
# public door. Host port 3000 is taken by another service, so we use 3200.
set -euo pipefail

VPS=root@80.241.213.128
REMOTE_DIR=/opt/influ-app-frontend
REPO=https://github.com/k1mmza/influ-app-frontend.git
API_URL=https://influ-app-backend.onrender.com
HOST_PORT=3200

echo "==> Pulling latest main on the VPS"
ssh "$VPS" "if [ -d $REMOTE_DIR/.git ]; then \
    cd $REMOTE_DIR && git fetch origin && git reset --hard origin/main; \
  else \
    git clone $REPO $REMOTE_DIR; \
  fi"

echo "==> Building image on the VPS (NEXT_PUBLIC_API_URL=$API_URL)"
ssh "$VPS" "cd $REMOTE_DIR && docker build --build-arg NEXT_PUBLIC_API_URL=$API_URL -t influ-app-frontend ."

echo "==> Restarting container"
ssh "$VPS" "docker stop influ-app-frontend 2>/dev/null || true; docker rm influ-app-frontend 2>/dev/null || true"
ssh "$VPS" "docker run -d --name influ-app-frontend --restart unless-stopped -p 127.0.0.1:$HOST_PORT:3000 influ-app-frontend"

echo "==> Health check (internal)"
ssh "$VPS" "sleep 2 && curl -sI http://127.0.0.1:$HOST_PORT | head -3"
echo "==> Done. Public URL: https://app.inflique.com"
