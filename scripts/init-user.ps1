Write-Host "Esperando a que MySQL esté listo..."
Start-Sleep -Seconds 10

Write-Host "Inicializando usuario..."

docker exec -i tjpubls-mysql mysql -uroot -prootpassword tjpubls -e "INSERT INTO role (role) VALUES ('admin') ON DUPLICATE KEY UPDATE role=role;"

docker exec tjpubls-backend sh -c "cd /app && npm run build && node -r dotenv/config dist/database/init-user.js"

Write-Host "✅ Usuario inicializado"
