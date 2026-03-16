FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/uploads /app/uploads/original /app/uploads/preview /app/uploads/hd /app/uploads/print /app/uploads/temp \
  && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
