FROM node:16.3.0-alpine

# Here you should set your ENV variables
ENV MONGODB_URI="mongodb://localhost:27017/test"
ENV PORT=3000
ENV PASSWORD="test"

WORKDIR /app

COPY package.json .

RUN npm i

ADD src/ ./src
ADD tsconfig.json ./

RUN npm run tsc

CMD [ "npm", "run", "start_lite" ]