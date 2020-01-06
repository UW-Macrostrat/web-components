#!/bin/bash

npm run build

cp ./deploy/Dockerfile dist

img=section-renderer-demo:latest
docker build -t $img dist
docker save $img | ssh -C birdnest docker load
