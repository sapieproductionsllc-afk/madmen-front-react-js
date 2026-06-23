#!/usr/bin/env bash
# Déploie le DASHBOARD MadMen en ligne -> https://app-madmen.ssmanager.uk
# Prérequis : (1) DNS  app-madmen.ssmanager.uk  ->  89.167.42.121
#             (2) API MadMen déjà déployée (sudo bash m.sh)
# Idempotent : relançable sans danger.
set -e
echo "== MadMen Dashboard : déploiement en ligne =="

mkdir -p /opt/madmen
cd /opt/madmen
if [ -d madmen-front-react-js/.git ]; then
  echo ">> Repo présent -> mise à jour (main)"
  cd madmen-front-react-js
  git fetch --all
  git checkout main 2>/dev/null || git checkout -b main origin/main
  git reset --hard origin/main
else
  rm -rf madmen-front-react-js
  git clone -b main https://github.com/sapieproductionsllc-afk/madmen-front-react-js.git
  cd madmen-front-react-js
fi

echo ">> Build + démarrage du dashboard (quelques minutes la 1re fois)..."
docker compose -f deploy/docker-compose.yml up -d --build

# Autorise le dashboard (origine app-madmen) à appeler l'API -> CORS côté API.
AENV=/opt/madmen/madmen-api-php/.env
if [ -f "$AENV" ] && ! grep -q "app-madmen.ssmanager.uk" "$AENV"; then
  sed -i 's|^\(CORS_ORIGIN=.*\)$|\1,https://app-madmen.ssmanager.uk|' "$AENV"
  docker compose -f /opt/madmen/madmen-api-php/deploy/docker-compose.yml --env-file "$AENV" restart api || true
  echo ">> CORS API mis à jour (autorise app-madmen)"
else
  echo ">> CORS API déjà OK (ou .env API introuvable)"
fi

# Route Caddy : app-madmen.ssmanager.uk -> conteneur madmen-front.
CF=/opt/ssm-cloud/deploy/Caddyfile.prod
if [ -f "$CF" ] && ! grep -q "app-madmen.ssmanager.uk" "$CF"; then
  cat >> "$CF" <<'EOF'

# ── Dashboard MadMen ─────────────────────────────────────
app-madmen.ssmanager.uk {
    reverse_proxy madmen-front:80
}
EOF
  echo ">> Route Caddy dashboard ajoutée"
else
  echo ">> Route Caddy déjà présente (ou Caddyfile introuvable)"
fi

echo ">> Reload de Caddy (sans coupure)..."
docker exec -w /etc/caddy ssm-caddy caddy reload --config /etc/caddy/Caddyfile || true

echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}'
echo ""
echo ">> FINI. Teste : https://app-madmen.ssmanager.uk"
