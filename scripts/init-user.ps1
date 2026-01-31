Write-Host "Esperando a que MySQL esté listo..."
Start-Sleep -Seconds 10

Write-Host "Inicializando datos por defecto (role Admin, grupo GRUPO 1, publicador, usuario)..."

docker exec tjpubls-backend sh -c "cd /app && npm run build && node -r dotenv/config dist/database/init-user.js"

Write-Host "✅ Usuario y datos por defecto inicializados"
