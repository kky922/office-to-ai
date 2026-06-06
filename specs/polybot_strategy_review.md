# 📊 폴리봇 현황 진단 및 전략 재설계 요청

> 작성: 소넷(Claude Code) | 2026-04-04
> 목적: Opus에게 실제 데이터 기반으로 폴리봇 재설계 요청

---

## 1. 현재 폴리봇 운영 상태

### 중단 경위
- 손실 발생으로 사용자가 수동으로 중단
- **자금 전액 그리드봇으로 이동됨**
- portfolio.json 모드: `manual` / 현재 포지션: **0개**

### trade_history.json 데이터 주의사항
- "open" 상태로 기록된 8건 존재하나 **실제 포지션 아님** (자금 이동 후 기록 미정리)
- 이 8건은 재설계 시 무시할 것

---

## 2. 실제 거래 성과 (trade_history.json 분석)

### 거래 현황
```
전체 거래:  141건
청산 완료:   60건
  - resolution(만기):  50건
  - manual(수동):       9건
  - trailing_stop:      1건
기록상 오픈:  8건 (실제 아님 — 위 설명 참고)
```

### 손익 현황
```
수익 거래:  1건  (+$6.62)   ← trailing_stop으로 청산된 BUY YES 1건
손실 거래:  9건  (-$20.70)  ← 전부 수동 청산
무손익:    50건  ($0.00)    ← 전부 resolution(만기) 청산
총 손익: -$14.08
```

### ⚠️ 중요: resolution 50건이 모두 profit=0인 이유 (버그)

resolution 청산 샘플:
```
entry=0.88  exit=0.88  profit=0.0  | Will Scottie Scheffler win the 2026 Masters
entry=0.92  exit=0.92  profit=0.0  | Will the Miami Heat win the NBA
entry=0.90  exit=0.90  profit=0.0  | Will the Orlando Magic win the NBA
```

**exit_price = entry_price 로 기록됨 → 실제 손익 계산 안 됨**

정상이라면:
- NO 매수 후 NO로 해결 → exit_price = 1.0, profit = 양수
- NO 매수 후 YES로 해결 → exit_price = 0.0, profit = 음수

현재는 만기 해결 시 실제 수익/손실이 **전혀 기록되지 않고 있음**.
→ 실제 총 손익은 -$14.08보다 훨씬 크거나 작을 수 있음 (알 수 없음)

---

## 3. 전략 구조 분석

### 전략별 거래 수
```
high_prob_no:      67건 (48%) ← 가장 많음
A-Longshot(Low):   30건 (21%)
E-LowProb:         14건 (10%)
A-Longshot(High):   5건  (4%)
E-HighProb:         3건  (2%)
기타(?):           22건 (15%)
```

### 핵심 전략 파라미터 (config.py 실제 값)

**LONGSHOT_NO** (A-Longshot(Low)):
```python
LONGSHOT_NO_MIN = 0.04   # YES 가격 4% 이상
LONGSHOT_NO_MAX = 0.12   # YES 가격 12% 이하일 때 BUY NO
→ NO 매수가: 0.88 ~ 0.96
```

**high_prob_no** (별도 전략, 67건):
```
평균 entry_price: 0.958
→ NO를 0.95~0.98에 매수 (YES는 2~5%짜리)
```

**LONGSHOT_YES** (A-Longshot(High)):
```python
LONGSHOT_YES_MIN = 0.85
LONGSHOT_YES_MAX = 0.93   # YES 가격 85~93%일 때 BUY YES
```

### 전략별 수익 구조 (수학적 분석)

| 전략 | 진입 | 수익(이기면) | 손실(지면) | 기댓값 |
|------|------|------------|----------|--------|
| high_prob_no | NO@0.96 | +4.2% | -96% | **-0.04×0.96 = -3.8%** |
| A-Longshot(Low) | NO@0.92 | +8.7% | -92% | **-0.08×0.92 = -7.4%** |
| A-Longshot(High) | YES@0.89 | +12.4% | -89% | **+0.11×0.89 = +9.8%** ✅ |

**high_prob_no와 Longshot(Low)은 구조적으로 장기 손실.**
**유일하게 합리적인 전략은 BUY YES (Longshot High)인데 5%만 사용됨.**

---

## 4. action 분포 (구조적 불균형)

```
BUY NO:  124건 (88%)
BUY YES:  17건 (12%)
```

수익을 낸 유일한 거래:
```
BUY YES | entry=0.84 → exit=0.94 | +$6.62
시장: Will the Oklahoma City Thunder win more than 62.5 games?
```

---

## 5. Opus에게 요청하는 재설계 방향

### 핵심 원칙 변경
> **현재**: "YES 가격이 낮은 이벤트에서 NO를 비싸게 산다" (손실 구조)
> **변경**: "실제 엣지(edge)가 있는 구간에서만 진입한다"

### 구체적 제안

#### A. NO 매수 기준 재정의
현재 NO@0.90~0.98 (YES 2~10%) → 수익률 2~11%, 손실 90~98%

제안: **YES 20~40%일 때만 NO 매수** (NO=0.60~0.80)
```
YES=25% → NO=0.75 매수
수익: +33%  /  손실: -75%
기댓값: 0.75 × 0.33 + 0.25 × (-1) = +0.248 - 0.25 = 0 (손익분기)
→ 수수료 고려해도 훨씬 유리
```

#### B. YES 매수 비중 확대
현재 12% → 50% 이상으로
YES 60~80% 구간 = 실제 엣지 가능 구간

#### C. high_prob_no 전략 비활성화 또는 기준 강화
현재 YES 2~5%에서 NO 매수 → 기댓값 마이너스 → **비활성화 권장**

#### D. resolution 청산 시 profit 기록 버그 수정
만기 청산 시 exit_price가 entry_price로 고정됨 → 실제 P&L 추적 불가
trader.py의 청산 로직 수정 필요

#### E. 동일 이벤트 포지션 제한
같은 이벤트 최대 2개 포지션 (현재 제한 없음)

---

## 6. 재가동 전 체크리스트

- [ ] resolution profit 기록 버그 수정 (trader.py)
- [ ] high_prob_no 전략 기준 강화 또는 비활성화
- [ ] LONGSHOT_NO 파라미터 변경 (YES 20~40%로)
- [ ] YES 매수 전략 비중 확대
- [ ] 동일 이벤트 포지션 제한 추가
- [ ] 재가동 전 백테스트로 전략 검증

---

## 7. 파일 구조 참고

```
~/polymarket_bot/
  config.py          ← LONGSHOT_NO_MIN/MAX 등 파라미터
  scanner.py         ← 신호 생성 로직
  trader.py          ← 진입/청산 실행 (profit 기록 버그 여기)
  rule_engine.py     ← 진입 규칙 판단
  trade_history.json ← 거래 기록 (141건)
  portfolio.json     ← 현재 포지션 (0개, manual 모드)
  settings.json      ← 운영 설정
```
