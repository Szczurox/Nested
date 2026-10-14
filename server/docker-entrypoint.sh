#!/bin/sh
set -eu

npx --no-install prisma migrate deploy
exec "$@"
