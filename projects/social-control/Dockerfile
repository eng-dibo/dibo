# copy this file to dist/social-control/Dockerfile
# also copy social-control/package.json and ROOT/package-lock.json

FROM node:lts
WORKDIR /social-control
# set NODE_ENV for files that uses process.env.NODE_ENV, such as server/main.js, config/*
ENV NODE_ENV="production"

# copy package*.json only, so `RUN npm install` execuds only when package*.json modified.
COPY package*.json ./

# use 'unsafe-perm' to force running 'postinstall'
# https://stackoverflow.com/a/69614679/12577650
# use --production=false to install devDependencies also
RUN npm config set unsafe-perm true
RUN npm install -f --production=false --fund=false

COPY . .

# set $PORT to be used by services like `Google cloude run`
ENV PORT=4200
EXPOSE $PORT

# todo: use 'npm run serve'
CMD npm start

