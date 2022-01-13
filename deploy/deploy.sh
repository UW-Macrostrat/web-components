#!/bin/bash

rm -rf dist
npm run build
#npm run build

#cp ./deploy/Dockerfile dist
#
# img=section-renderer-demo:latest
# docker build -t $img dist
# docker save $img | ssh -C birdnest docker load
rsync -azv --delete dist/ birdnest:/projects/static-sites/section-renderer/
rsync -azv --delete dist/ davenquinn:static-sites/viz/macrostrat-column-renderer/
