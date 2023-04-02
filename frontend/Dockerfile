# Choose builder base image
FROM node:16-alpine

# Create app directory
WORKDIR /srv/app

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm i

COPY . .

RUN npm run build

# Start app
CMD npm run start
