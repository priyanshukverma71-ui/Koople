FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
