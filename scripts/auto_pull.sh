#!/bin/bash
cd ~/claude-cursor

echo "🔄 GitHub에서 Pull 중..."
git pull origin main

echo ""
echo "📋 최신 지시서:"
echo "────────────────────────"
head -20 specs/_latest.md
echo "────────────────────────"
echo ""
echo "💡 Cursor에서: ⌘+I → @specs/_latest.md 이 스펙대로 구현해줘"
