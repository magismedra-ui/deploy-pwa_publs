#!/bin/bash

echo "Esperando a que MySQL esté listo..."
sleep 10

echo "Inicializando datos por defecto (role Admin, grupo GRUPO 1, publicador, usuario)..."

docker exec tjpubls-backend sh -c "cd /app && npm run build && node -r dotenv/config dist/database/init-user.js"

echo "✅ Usuario y datos por defecto inicializados"
