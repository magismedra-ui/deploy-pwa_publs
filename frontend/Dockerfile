# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL se pasa como build arg desde Render
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Stage 2: serve con nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runner
# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
