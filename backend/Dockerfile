FROM node:20-alpine

RUN apk add --no-cache netcat-openbsd dos2unix

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN dos2unix entrypoint.sh 2>/dev/null || true && \
	chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
