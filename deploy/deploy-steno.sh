#!/bin/bash

build_dir=./dist/
public_url=/next/ui-concepts/

parcel build \
  --dist-dir $build_dir \
  --public-url $public_url \
  apps/index.html

rsync -azv --delete $build_dir steno:/data/projects/macrostrat$public_url