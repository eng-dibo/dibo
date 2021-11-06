# copy this file to dist/ngx-cms/Dockerfile
# also copy ngx-cms/package.json and ROOT/package-lock.json

FROM node:12
WORKDIR /ngx-cms
# set NODE_ENV for files that uses process.env.NODE_ENV, such as core/main.js, config/*
ENV NODE_ENV="production"

# copy package*.json only, so `RUN npm install` execuds only when package*.json modified.
COPY package*.json ./

# in production mode, npm will not install devDependencies without '--also=dev' flag
# using '--production=false' has no effect when installing a module
# https://stackoverflow.com/a/34700657/12577650
# use --no-save to not modify package.json for caching
# install @angular/cli to run 'ngcc', dotenv to run 'npm run serve'
RUN npm install -D --also=dev --no-save --fund=false dotenv@^10.0.0 @angular/cli@~12.2.6

# use 'unsafe-perm' to force running 'postinstall'
# https://stackoverflow.com/a/69614679/12577650
RUN npm config set unsafe-perm true
RUN npm install --only=prod --fund=false

COPY . .

# set $PORT to be used by services like `Google cloude run`
ENV PORT=4200
EXPOSE $PORT

# todo: use 'npm run serve'
CMD node -r dotenv/config ./core/server/main.js --start dotenv_config_path=./config/.env 


