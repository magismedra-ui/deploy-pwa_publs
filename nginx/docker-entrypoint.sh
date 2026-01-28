#!/bin/sh
set -e

echo "Esperando a que el backend esté disponible..."
until wget --no-check-certificate --spider --quiet http://backend:3000/health 2>/dev/null || [ $? -eq 8 ]; do
	echo "Backend no disponible aún, esperando..."
	sleep 2
done

echo "Backend está disponible, iniciando nginx..."
exec nginx -g 'daemon off;'
