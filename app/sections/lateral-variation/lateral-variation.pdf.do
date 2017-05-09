#!/usr/bin/env zsh

redo-ifchange index.coffee labels.yaml main.styl section.coffee sql/*.sql

pdf-printer --dpi 1200 index.coffee $3 >&2
