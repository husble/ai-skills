---
name: shared-files
description: Upload files to AWS S3 and return a public URL. Use when the user needs to share files, host assets, or upload data to an S3 bucket / CDN.
---

# Shared Files

## Overview

This skill uploads local files to an AWS S3 bucket under the `shared/` prefix and returns the public URL. It uses a zero-dependency Node.js script (AWS Signature V4, no SDK) for maximum compatibility.

## Setup Requirements

To use this skill, provide the following environment variables. The script reads them from the real environment first, then falls back to a `.env` file (it looks next to the script, then walks up to the project root, then the current directory). Anything already exported in your shell wins over `.env`:

- `SHARED_AWS_ACCESS_KEY_ID`: Your AWS Access Key ID.
- `SHARED_AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key.
- `SHARED_AWS_S3_BUCKET`: The name of the S3 bucket.
- `SHARED_AWS_REGION`: The AWS region (defaults to `us-east-1`).
- `SHARED_CDN_BASE_URL`: Optional. Base URL to build the returned link. Defaults to the path-style S3 URL derived from bucket + region (`https://s3.<region>.amazonaws.com/<bucket>`). Set this only if you serve the bucket through your own CDN domain.

## Workflow

1.  **Trigger**: The user asks to "upload", "share", or "host" a file.
2.  **Validation**: Verify the file exists locally.
3.  **Upload**: Run the `scripts/upload.cjs` script with the file path.
4.  **Result**: Display the resulting public URL to the user.

## Examples

### Uploading a report
User: "Upload the report in reports/summary.md to the shared CDN"
Agent: Runs `node scripts/upload.cjs reports/summary.md`

### Sharing an image
User: "Share this image: assets/logo.png"
Agent: Runs `node scripts/upload.cjs assets/logo.png`

## Resources

### scripts/upload.cjs
A standalone Node.js script that performs the S3 PUT request using AWS Signature Version 4. It requires no external dependencies.
