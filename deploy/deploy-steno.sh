#!/bin/bash

build_dir=./dist/steno/
public_url=/next/ui-concepts/

parcel build \
  --out-dir $build_dir \
  --public-url $public_url \
  apps/*/index.html apps/index.html

rsync -azv --delete $build_dir steno:/data/projects/macrostrat$public_url