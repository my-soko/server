FROM node:20-slim

WORKDIR /server

# System deps required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --production
RUN npx prisma generate

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
