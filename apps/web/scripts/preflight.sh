#!/bin/bash
# Run this before the demo to ensure everything is ready

echo "🏛️  AGENT COURT - Pre-Demo Verification"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from apps/web directory"
    echo "   cd apps/web"
    exit 1
fi

echo "✓ In correct directory"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Installing dependencies..."
    npm install
fi

echo "✓ Dependencies installed"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
ANTHROPIC_API_KEY=""
TINYFISH_API_KEY=""
GUILD_API_KEY=""
EOF
    echo "✓ .env file created"
else
    echo "✓ .env file exists"
fi

# Check if server is already running
if curl -s http://localhost:3000/api/cases > /dev/null 2>&1; then
    echo "✓ Server already running at http://localhost:3000"
else
    echo "⚠️  Server not running. Start with: npm run dev"
fi

# Test API endpoint
echo ""
echo "Testing API..."
RESPONSE=$(curl -s http://localhost:3000/api/cases)
if echo "$RESPONSE" | grep -q "cases"; then
    echo "✓ API responding correctly"
else
    echo "⚠️  API may not be working. Check server logs."
fi

echo ""
echo "========================================"
echo "✅ Pre-flight check complete!"
echo ""
echo "Next steps:"
echo "1. If server not running: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Click 'New Case'"
echo "4. Watch the magic happen"
echo ""
echo "Good luck! 🚀"
