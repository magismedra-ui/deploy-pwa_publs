# TJPubls Frontend

Aplicación móvil PWA desarrollada con Ionic + React + TypeScript.

## Características

- **Offline First**: SQLite como fuente de verdad local
- **Sync Engine**: Sincronización automática con el backend
- **UUID v4**: IDs generados en el cliente
- **Capacitor**: Soporte para iOS y Android

## Instalación

```bash
cd frontend
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Capacitor

```bash
# Sincronizar con plataformas nativas
npm run sync

# iOS
npm run ios

# Android
npm run android
```

## Variables de Entorno

Crear archivo `.env`:

```
VITE_API_URL=http://localhost/api/v1
```
