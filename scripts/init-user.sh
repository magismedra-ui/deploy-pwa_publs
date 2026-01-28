#!/bin/bash

echo "Esperando a que MySQL esté listo..."
sleep 10

echo "Inicializando usuario..."

docker exec -i tjpubls-mysql mysql -uroot -prootpassword tjpubls <<EOF
INSERT INTO role (role) VALUES ('admin') ON DUPLICATE KEY UPDATE role=role;
EOF

docker exec tjpubls-backend sh -c "cd /app && npm run build && node -r dotenv/config dist/database/init-user.js"

echo "✅ Usuario inicializado"
