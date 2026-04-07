#!/bin/bash

# ============================================================
# Sympos Garden Design — Quick Setup Script
# ============================================================

echo ""
echo "🌿 =============================================="
echo "   Sympos Garden Design — Setup"
echo "   =============================================="
echo ""

# Check for Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install it from https://nodejs.org"
  exit 1
fi

# Check for MySQL
if ! command -v mysql &> /dev/null; then
  echo "⚠️  MySQL CLI not found. Make sure MySQL is installed and running."
fi

echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo ""
echo "1. Set up your database:"
echo "   mysql -u root -p < backend/schema.sql"
echo ""
echo "2. Configure your environment:"
echo "   cp backend/.env.example backend/.env"
echo "   Then edit backend/.env with:"
echo "   - DB_PASSWORD=your_mysql_password"
echo "   - ANTHROPIC_API_KEY=your_key_from_console.anthropic.com"
echo ""
echo "3. Start the backend (Terminal 1):"
echo "   cd backend && npm start"
echo ""
echo "4. Start the frontend (Terminal 2):"
echo "   cd frontend && npm start"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo "   Click 'Try Demo' to skip login!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
