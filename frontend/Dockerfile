FROM node:16-alpine

# Create app directory
WORKDIR /frontend/app

# Install app dependencies
COPY frontend/package.json frontend/package-lock.json ./

RUN npm i

RUN next build

COPY . .

# Start app
CMD next start
