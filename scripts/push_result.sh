#!/bin/bash
cd ~/claude-cursor

MESSAGE="${1:-결과 업데이트}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# results/_latest.md 업데이트
echo "# 📊 작업 결과: ${MESSAGE}" > results/_latest.md
echo "" >> results/_latest.md
echo "> 시간: ${TIMESTAMP}" >> results/_latest.md
echo "" >> results/_latest.md
echo "## 상세 내용" >> results/_latest.md
echo "(아래에 Cursor 결과/에러를 붙여넣으세요)" >> results/_latest.md

# 코드베이스 스냅샷 자동 생성 (Opus 지시서 품질 향상용)
echo ""
echo "🔄 코드 스냅샷 업데이트 중..."
bash ~/claude-cursor/scripts/gen_snapshot.sh

# GitHub에 Push
git add -A
git commit -m "📊 ${MESSAGE}"
git push origin main

echo ""
echo "✅ Push 완료! iPad에서 확인하세요"
