#!/bin/bash

# This script helps set up environment variables securely
# Usage: ./scripts/setup-env.sh [environment]

set -e

ENV=${1:-development}
ENV_FILE=".env.${ENV}"
SECRETS_DIR="secrets"

# Create the secrets directory if it doesn't exist
mkdir -p "$SECRETS_DIR"

# Check if git-crypt is initialized
if ! git-crypt status > /dev/null 2>&1; then
  echo "Initializing git-crypt..."
  git-crypt init
fi

# Create or update environment file
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating $ENV_FILE..."
  cp .env.example "$ENV_FILE"
  
  echo -e "\nPlease update the following values in $ENV_FILE:"
  grep -E '^[A-Z]' "$ENV_FILE" | sed 's/=/ [value]/'
  
  read -p "Press Enter to continue after updating the values..."
fi

# Create a symlink to the environment file
ln -sf "$ENV_FILE" .env

echo "Environment setup complete for $ENV"
echo "Don't forget to commit your changes with git-crypt enabled"
echo "Make sure to back up your git-crypt key with: git-crypt export-key ~/git-crypt-key"
