FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run release:check

FROM nginx:1.27-alpine

COPY ops/nginx.conf /etc/nginx/conf.d/default.conf
COPY ops/docker-entrypoint.d/40-render-runtime-config.sh /docker-entrypoint.d/40-render-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-render-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
