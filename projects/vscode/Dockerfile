# now we use `codercom/code-server` image, so we don't need to build this image anymore

FROM node:slim

# install code-server using the script
RUN curl -fsSL https://code-server.dev/install.sh | sh

# set $PORT to be used by services like 'Google cloude run'
ENV PORT=8080
EXPOSE $PORT

# run code-server, then open the browser at http://127.0.0.1:8080
CMD code-server

