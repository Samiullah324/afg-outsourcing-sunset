#!/bin/sh

# Exit on any error
set -e

echo "Starting Frontend Application..."



# Determine package manager
if command -v bun >/dev/null 2>&1; then
    PKG_MANAGER="bun"
    echo "Using bun as package manager"
else
    PKG_MANAGER="npm"
    echo "Using npm as package manager"
fi

# Check if we're in development mode
if [ "$NODE_ENV" = "development" ]; then
    echo "Running in development mode..."
    if [ "$PKG_MANAGER" = "bun" ]; then
        exec bun run dev --host 0.0.0.0 --port 3000
    else
        exec npm run dev -- --host 0.0.0.0 --port 3000
    fi
else
    echo "Building application for production..."
    if [ "$PKG_MANAGER" = "bun" ]; then
        bun run build
        echo "Starting production server..."
        exec bun run preview --host 0.0.0.0 --port 3000
    else
        npm run build
        echo "Starting production server..."
        exec npm run preview -- --host 0.0.0.0 --port 3000
    fi
fi
