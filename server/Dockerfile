FROM node:16-alpine

# Create app directory
WORKDIR /srv/app

# Install app dependencies
COPY server/package.json server/package-lock.json ./

RUN npm i

COPY server .

COPY data/marking/enter-aggregate.csv /srv/data/marking/enter-aggregate.csv
COPY data/marking/leave-aggregate.csv /srv/data/marking/leave-aggregate.csv
COPY data/marking/enter-aggregate-smooth.csv /srv/data/marking/enter-aggregate-smooth.csv
COPY data/marking/leave-aggregate-smooth.csv /srv/data/marking/leave-aggregate-smooth.csv
COPY dictionary /srv/dictionary

# Start app
CMD npm run start
