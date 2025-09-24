#!/bin/bash

echo "🚀 Starting Ignite Rewards Local Development Environment"
echo

echo "📊 Checking PostgreSQL connection..."
psql -U postgres -d ignite_rewards -c "SELECT 'PostgreSQL is running!' as status;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL connection failed. Please ensure PostgreSQL is running."
    echo "   Make sure the service is started and the password is correct."
    exit 1
fi
echo "✅ PostgreSQL connection successful"

echo
echo "🔧 Setting up environment..."
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp local-env-config.env .env.local
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

echo
echo "📦 Installing dependencies..."
if [ ! -d node_modules ]; then
    echo "Installing npm packages..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo
echo "🌐 Starting development server..."
echo "   The application will be available at: http://localhost:8084"
echo "   Admin login: admin@igniterewards.com / admin123!"
echo
echo "Press Ctrl+C to stop the server"
echo

npm run dev
