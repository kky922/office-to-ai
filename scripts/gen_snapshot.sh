#!/bin/bash
# =====================================================
# 코드베이스 스냅샷 생성 — Opus 지시서 품질 향상용
#
# 두 곳에 동시 기록:
#   1) specs/codebase_snapshot.md  (전체 상세본)
#   2) results/_latest.md 하단     (Opus에게 바로 전달용 요약)
# =====================================================

BOT_DIR="${HOME}/polymarket_bot"
SPEC_OUT="${HOME}/claude-cursor/specs/codebase_snapshot.md"
RESULT_OUT="${HOME}/claude-cursor/results/_latest.md"
DATE=$(date +"%Y-%m-%d %H:%M KST")

# ── 1) specs/codebase_snapshot.md 전체 상세본 ─────────
cat > "$SPEC_OUT" << HEADER
# 🗂️ 코드베이스 스냅샷 (Opus 지시서 작성 참고용)

> 자동 생성: ${DATE}
> **지시서 작성 전 반드시 이 파일 참고 — 실제 함수명·구조 기준**

---

HEADER

echo "## 📄 grid_bot/multi_grid_bot.py" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "### MultiGridBot.__init__ 주요 속성" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
awk '/def __init__.*MultiGridConfig/,/def _telegram/' "$BOT_DIR/grid_bot/multi_grid_bot.py" 2>/dev/null | head -40 >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "### 전체 메서드 목록 (실제 함수명)" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
grep -n "^    def \|^    async def " "$BOT_DIR/grid_bot/multi_grid_bot.py" 2>/dev/null \
  | sed 's/.*def /def /' | sed 's/(.*/(...)/' >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "---" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "## 📄 grid_bot/trend_detector.py" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "### Trend Enum 값" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
awk '/^class Trend/,/^class [A-Z]/' "$BOT_DIR/grid_bot/trend_detector.py" 2>/dev/null | head -10 >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "### TrendSignal 주요 필드" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
awk '/^class TrendSignal/,/^    def to_dict/' "$BOT_DIR/grid_bot/trend_detector.py" 2>/dev/null | head -25 >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "### 모든 함수 목록" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
grep -n "^def \|^    def " "$BOT_DIR/grid_bot/trend_detector.py" 2>/dev/null \
  | sed 's/.*def /def /' | sed 's/(.*/(...)/' >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "---" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "## 📄 grid_bot/multi_config.py (SingleGridConfig 필드)" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
awk '/^@dataclass/,/^@dataclass|^class [A-Z][a-z]/' "$BOT_DIR/grid_bot/multi_config.py" 2>/dev/null | head -60 >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "---" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "## ⚙️ .env 주요 그리드 설정" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
grep "^GRID_" "$BOT_DIR/.env" 2>/dev/null >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

echo "---" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo "## 📊 현재 봇 운영 상태" >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
python3 -c "
import json
try:
    d = json.load(open('${BOT_DIR}/grid_bot/grid_status.json'))
    t = d.get('total', {})
    r = d.get('reinvestor', {})
    print(f'총 자본: \${d.get(\"grand_total\", 0):,.2f}')
    print(f'코인:USDT = {t.get(\"total_coin_value\",0)/d.get(\"grand_total\",1)*100:.0f}:{t.get(\"usdt_balance\",0)/d.get(\"grand_total\",1)*100:.0f}')
    print(f'누적 수익: \${r.get(\"total_profit\", 0):.2f}')
    print(f'누적 거래: ETH {r[\"coins\"][\"ETH\"][\"total_trades\"]}건 / BTC {r[\"coins\"][\"BTC\"][\"total_trades\"]}건')
    for k, v in d.get('coins', {}).items():
        print(f'{k}: 간격 \${v[\"grid_spacing\"]:.2f} ({v[\"grid_spacing\"]/v[\"current_price\"]*100:.2f}%) | 범위 \${v[\"grid_lower\"]:,.0f}~\${v[\"grid_upper\"]:,.0f}')
except Exception as e:
    print(f'상태 읽기 실패: {e}')
" 2>/dev/null >> "$SPEC_OUT"
echo '```' >> "$SPEC_OUT"
echo "" >> "$SPEC_OUT"

cat >> "$SPEC_OUT" << 'FOOTER'
---

## ⚠️ 지시서 작성 시 주의사항

- **취소+재배치**: `_atr_respace_coin(coin_bot: CoinBot)` — symbol 아닌 CoinBot 객체 받음
- **전체 취소**: `_cancel_open_orders_for_config_symbols(stage: str)` — 모든 심볼 한번에
- **코인 루프**: `for coin_bot in self.coin_bots:` — `coin_configs` 없음
- **추세 신호**: `self.trend_signals[coin_bot.name]` → TrendSignal 객체 (1시간마다 자동 갱신)
- **그리드 모드**: `coin_bot.optimizer_mode` = "normal" / "reverse_up" / "defensive"
- **투자금 수정**: `coin_bot.config.investment` — 줄이면 안 됨 (복리 버그 수정 완료)
- **절대 건드리지 말 것**: bot.py, exchange.py, .env (API 키), portfolio.json
FOOTER

# ── 2) results/_latest.md 하단에 요약 섹션 추가 ────────
cat >> "$RESULT_OUT" << SNAPSHOT

---

## 🗂️ 코드 스냅샷 (Opus 다음 지시서 참고용)
> ${DATE} 자동 생성

### 실제 함수명 (핵심)
\`\`\`
# 코인 루프
for coin_bot in self.coin_bots:   ← coin_configs 없음

# 취소+재배치 (per coin)
await self._atr_respace_coin(coin_bot)   ← CoinBot 객체 받음

# 전체 취소
self._cancel_open_orders_for_config_symbols(stage)

# 추세 신호 (이미 1시간마다 자동 갱신)
sig = self.trend_signals[coin_bot.name]  → TrendSignal
sig.trend  → Trend.STRONG_UP / UP / SIDEWAYS / DOWN / STRONG_DOWN
sig.confidence  → float (%)

# 그리드 모드
coin_bot.optimizer_mode = "normal" | "reverse_up" | "defensive"
\`\`\`

### 현재 봇 상태
\`\`\`
$(python3 -c "
import json
try:
    d = json.load(open('${BOT_DIR}/grid_bot/grid_status.json'))
    t = d.get('total', {})
    r = d.get('reinvestor', {})
    grand = d.get('grand_total', 1)
    print(f'총 자본: \${grand:,.2f}')
    print(f'코인:USDT = {t.get(\"total_coin_value\",0)/grand*100:.0f}:{t.get(\"usdt_balance\",0)/grand*100:.0f}')
    print(f'누적 수익: \${r.get(\"total_profit\", 0):.2f} (ETH {r[\"coins\"][\"ETH\"][\"total_trades\"]}건 / BTC {r[\"coins\"][\"BTC\"][\"total_trades\"]}건)')
    for k, v in d.get('coins', {}).items():
        print(f'{k}: 간격 {v[\"grid_spacing\"]/v[\"current_price\"]*100:.2f}% | 범위 \${v[\"grid_lower\"]:,.0f}~\${v[\"grid_upper\"]:,.0f}')
except Exception as e:
    print(f'상태 읽기 실패: {e}')
" 2>/dev/null)
\`\`\`

### ⚠️ 절대 건드리지 말 것
bot.py / exchange.py / .env(API키) / portfolio.json
SNAPSHOT

echo "✅ 스냅샷 생성 완료 (specs + results 동시 반영)"
