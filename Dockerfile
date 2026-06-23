# Dashboard MadMen — build Vite puis service statique via nginx.
# L'URL de l'API est figée AU BUILD (Vite). Override : --build-arg VITE_API_URL=...
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
ARG VITE_API_URL=https://api-madmen.ssmanager.uk
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
