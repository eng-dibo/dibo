# build a container image from dist
# copy this file to dist
# also we need to install dependencies (not devDependencies) 
# that exluded frpm webpack bundling (webpack.externals[])
# copy $root/package.json
# RUN npm install --only=prod

FROM node:12
WORKDIR .
COPY . .


# set $PORT to be used by services like `Google cloude run`
ENV PORT=4200
EXPOSE $PORT

# set NODE_ENV for config/* files that use process.env.NODE_ENV
# todo: test which one works, cross-env-shell NODE_ENV=.. or ENV NODE_ENV=..
ENV NODE_ENV="production"
# todo: CMD cross-env-shell NODE_ENV=${NODE_ENV} npm run serve 
CMD node ./ngx-cms/core/server/main.js --start
