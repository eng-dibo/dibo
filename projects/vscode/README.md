this project creats a cloud-based [visual studio code](https://github.com/cdr/code-server)
it enables you to develop your projects on the fly from your browser without actually installing vscode on your machine.

## select a project

to run a project bind it to `/home/coder/project`.
by default we bind to `$project` or `$PWD`

see the script `docker:run` as an example

## example

this is the same command used in the script `docker:run` with explanation

```
docker run -it --name vscode \
  # Publish container's ports to the host
  -p 8080:8080 \
  # bind volume ~/.config and ~/.local to the host machine
  # so it uses the configurations (such as code-server password) and extends already installed in the host.
  -v "$HOME/.config:/home/coder/.config" \
  -v "${project3:-$PWD}:/home/coder/project" \
  # forward your UID/GID so that all file system operations occur as your user outside the container.
  -u "$(id -u):$(id -g)" \
  -e "DOCKER_USER=$USER" \
  gcr.io/dibo-cloud/vscode:latest
```

to use a project folder with vscode, set `project` path

```
export project=~ && npm run docker:run
```

## use vscode as a web server

you can build the image and deploy it to gcloud run, so you can access it from a web address like `http://eample-vscode.com`

run `npm start`
