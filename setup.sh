#!/bin/bash

echo "🚀 Setting up Joachim App - Real-time AI Conversation"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating .env.example..."
    echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.example
    echo "📝 Please create a .env file with your OpenAI API key:"
    echo "   cp .env.example .env"
    echo "   Then edit .env and add your actual OpenAI API key"
else
    echo "✅ .env file found"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Make sure you have a .env file with your OpenAI API key"
echo "2. Start the backend server: npm run server"
echo "3. In another terminal, start the frontend: npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For more information, see README.md" 