FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@9.0.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps/docs/package.json ./apps/docs/package.json
RUN pnpm --filter @houdoku/docs install --frozen-lockfile --ignore-scripts
COPY apps/docs/src ./apps/docs/src
RUN pnpm --filter @houdoku/docs build

FROM caddy:2-alpine
COPY apps/docs/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/docs/src/.vitepress/dist /srv
COPY LICENSE.txt /srv/LICENSE.txt
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
