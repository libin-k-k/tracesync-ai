FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN if [ -f package.json ]; then npm install --legacy-peer-deps; fi

COPY . .

EXPOSE 3030

CMD ["npm", "run", "start:dev"]
