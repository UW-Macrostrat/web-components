#!/usr/bin/env bash
# Build the storybook for production and upload it to an S3 bucket

yarn run build:storybook

# Upload the built storybook to S3
# load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Use Rclone to sync the built storybook to S3, without RClone config

echo "Uploading to S3 bucket: $S3_BUCKET"

rclone sync ./storybook-static \
  :s3:"$S3_BUCKET/$S3_PATH" \
  --s3-provider=Ceph \
  --s3-endpoint="$S3_ENDPOINT" \
  --s3-access-key-id="$S3_ACCESS_KEY" \
  --s3-secret-access-key="$S3_SECRET_KEY"
