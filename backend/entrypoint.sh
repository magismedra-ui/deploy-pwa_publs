#!/bin/sh

echo "Esperando a que MySQL esté listo..."
until nc -z mysql 3306; do
	sleep 1
done

echo "Esperando a que Redis esté listo..."
until nc -z redis 6379; do
	sleep 1
done

echo "Compilando TypeScript..."
npm run build

echo "Inicializando usuario..."
node dist/database/init-user.js || echo "⚠️  Advertencia: No se pudo inicializar el usuario (puede que ya exista)"

echo "Iniciando servidor..."
npm start
