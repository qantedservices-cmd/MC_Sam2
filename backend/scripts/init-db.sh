#!/bin/bash

# Script to initialize the PostgreSQL database with data from db.json

echo "🚀 Initializing MonChantier PostgreSQL Database"

# Check if db.json exists
if [ ! -f "../data/db.json" ] && [ ! -f "./data/db.json" ]; then
    echo "⚠️ Warning: db.json not found. Database will be empty."
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed the database if db.json exists
if [ -f "../data/db.json" ]; then
    echo "🌱 Seeding database from db.json..."
    DB_JSON_PATH="../data/db.json" npx tsx src/seed.ts
elif [ -f "./data/db.json" ]; then
    echo "🌱 Seeding database from db.json..."
    DB_JSON_PATH="./data/db.json" npx tsx src/seed.ts
else
    echo "ℹ️ Skipping seed - no db.json found"
fi

echo "✅ Database initialization complete!"
