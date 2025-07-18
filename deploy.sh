#!/bin/bash

# Deployment script for the Tic-Tac-Toe game
echo "🚀 Starting deployment process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Built files are in the 'dist' directory"
    echo ""
    echo "🌐 Deployment options:"
    echo "  - Vercel: Connect your Git repository to Vercel and deploy"
    echo "  - Netlify: Upload the 'dist' folder to Netlify"
    echo "  - Railway: Connect your Git repository to Railway"
    echo "  - Manual: Upload the 'dist' folder to your hosting provider"
    echo ""
    echo "📋 Environment variables to set on your hosting platform:"
    echo "  - NODE_ENV=production (required)"
    echo "  - DATABASE_URL=your_postgres_url (optional - uses in-memory storage otherwise)"
    echo "  - PORT=5000 (usually set automatically by hosting platforms)"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi