FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts ./
COPY app ./app
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8740 MONEY_MODE=simulation
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/app/server ./app/server
COPY --from=build --chown=node:node /app/app/shared ./app/shared
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 8740
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:8740/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","start"]
