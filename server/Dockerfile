FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/uploads /app/uploads/original /app/uploads/processed /app/uploads/temp /app/config \
  && chown -R node:node /app

VOLUME ["/app/uploads"]

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
