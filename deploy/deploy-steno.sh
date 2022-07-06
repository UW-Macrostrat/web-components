#!/bin/bash

build_dir=./dist
public_url=/next/ui-concepts/

# Deploy ui concepts to dev.macrostrat.org/next/ui-concepts/
parcel build \
  --dist-dir $build_dir \
  --public-url $public_url \
  apps/index.html

# Deploy storybook to dev.macrostrat.org/next/ui-concepts/stories/
npx build-storybook --modern --output-dir $build_dir/stories

# Upload the files
rsync -azv --delete $build_dir/ steno:/data/projects/macrostrat$public_url


