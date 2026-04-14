FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p uploads/prescriptions
EXPOSE 8080
CMD ["node", "server.js"]
