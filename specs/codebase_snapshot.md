# 🗂️ 코드베이스 스냅샷 (Opus 지시서 작성 참고용)

> 자동 생성: 2026-04-04 17:36 KST
> **지시서 작성 전 반드시 이 파일 참고 — 실제 함수명·구조 기준**

---

## 📄 grid_bot/multi_grid_bot.py

### MultiGridBot.__init__ 주요 속성
```
    def __init__(self, multi_config: MultiGridConfig) -> None:
        self.multi_config = multi_config
        self.base_grid_config = GridConfig()
        self.exchange = BybitExchange(self.base_grid_config)
        self.telegram = GridTelegram(self.base_grid_config)
        self.telegram_mode = multi_config.telegram_mode

        self.coin_bots: List[CoinBot] = []

        self.is_running = False
        self.start_time: Optional[datetime] = None
        self.last_hourly_report: float = 0.0
        self._last_status_save: float = 0.0

        # 방어·추세·배분·재배치 (Smart Grid)
        self.trend_detector = TrendDetector(self.exchange)
        self.defense_manager = DefenseManager(self.exchange)
        self.allocator = SmartAllocator()
        self.rebalancer = AutoRebalancer()
        self.balance_rebalancer = BalanceRebalancer(self.exchange)
        # 한글 주석: 고급 최적화기는 기능 ON일 때만 실제 동작하도록 별도 게이트를 둡니다.
        self.grid_optimizer = GridOptimizer(self.exchange, self.trend_detector)
        self.profit_reinvestor = ProfitReinvestor()
        self.last_trend_check: float = 0.0
        self.trend_signals: Dict[str, Any] = {}
        self._no_fill_log_counter: Dict[str, int] = {}
        # ATR 동적 간격 주기 재계산·재배치
        self._last_atr_recalc_ts: float = 0.0
        self._last_atr_spacings: Dict[str, float] = {}
        # 4단계: 트렌드 시프트 — 이전 optimizer_mode 추적 (변화 감지용)
        self._last_trend_mode: Dict[str, str] = {}
        # 4단계: 자동 리밸런싱 — 타이머 + 기동 시 1회 플래그
        self._last_rebalance_check_ts: float = 0.0
        self._initial_rebalance_done: bool = False

    def _telegram_enabled(self) -> bool:
```

### 전체 메서드 목록 (실제 함수명)
```
def __init__(...)
def _telegram_enabled(...)
def _telegram_verbose(...)
def _apply_reverse_grid(...)
def _usdt_only_buy_mode(...)
def _calculate_usdt_buy_amounts(...)
def _grid_total_asset_usd(...)
def _allocator_input_usd(...)
def _refresh_strategy_with_mode(...)
def _cancel_open_orders_for_config_symbols(...)
def initialize(...)
def _rebalance_coin_grid(...)
def _atr_respace_coin(...)
def _maybe_atr_respace_grids(...)
def _maybe_trend_shift_grids(...)
def _maybe_auto_rebalance(...)
def _place_hybrid_initial_for_coin(...)
def place_initial_orders(...)
def check_fills_for_coin(...)
def _get_total_profit(...)
def _get_total_trades(...)
def _portfolio_equity_usd(...)
def _allocated_equity_for_risk(...)
def save_status(...)
def run(...)
def _send_hourly_report(...)
def _emergency_shutdown(...)
def shutdown(...)
def _get_uptime(...)
def handle_signal(...)
```

---

## 📄 grid_bot/trend_detector.py

### Trend Enum 값
```
class Trend(Enum):
class TrendSignal:
class TrendDetector:
```

### TrendSignal 주요 필드
```
class TrendSignal:
    """추세 분석 최종 결과 (대시보드·배분·재배치에서 참조)."""

    trend: Trend
    confidence: float
    current_price: float

    ema_short: float = 0.0
    ema_long: float = 0.0
    rsi: float = 50.0
    atr: float = 0.0
    atr_pct: float = 0.0
    macd: float = 0.0
    macd_signal: float = 0.0
    macd_histogram: float = 0.0
    bb_upper: float = 0.0
    bb_middle: float = 0.0
    bb_lower: float = 0.0
    bb_width_pct: float = 0.0
    obv_trend: str = "NEUTRAL"
    mfi: float = 50.0
    stoch_k: float = 50.0
    stoch_d: float = 50.0

    indicators: List[IndicatorResult] = field(default_factory=list)
```

### 모든 함수 목록
```
def to_dict(...)
def __init__(...)
def analyze(...)
def _ema(...)
def _rsi(...)
def _atr(...)
def _ema_array(...)
def _macd(...)
def _bollinger_bands(...)
def _obv(...)
def _mfi(...)
def _stochastic(...)
def _atr_exchange_and_config(...)
def _get_atr_exchange(...)
def log_atr_status(...)
def get_current_atr(...)
def get_atr_grid_spacing(...)
```

---

## 📄 grid_bot/multi_config.py (SingleGridConfig 필드)

```
@dataclass
@dataclass
```

---

## ⚙️ .env 주요 그리드 설정

```
GRID_SYMBOL=ETHUSDT
GRID_INVESTMENT=20
GRID_UPPER=2124
GRID_LOWER=1883
GRID_COUNT=3
GRID_MODE=arithmetic
GRID_ETH_SYMBOL=ETHUSDT
GRID_ETH_INVESTMENT=1455
GRID_ETH_UPPER=2220
GRID_ETH_LOWER=1891
GRID_ETH_COUNT=20
GRID_ETH_MODE=arithmetic
GRID_BTC_SYMBOL=BTCUSDT
GRID_BTC_INVESTMENT=1058
GRID_BTC_UPPER=72872
GRID_BTC_LOWER=62076
GRID_BTC_COUNT=20
GRID_BTC_MODE=arithmetic
GRID_TOTAL_INVESTMENT=2300
GRID_RESERVE=80
GRID_TELEGRAM_MODE=emergency_only
GRID_ETH_RATIO=55
GRID_BTC_RATIO=40
GRID_RESERVE_PCT=5
GRID_COMPOUND_ENABLED=true
GRID_COMPOUND_THRESHOLD=5
GRID_COMPOUND_INTERVAL_HOURS=4
GRID_TREND_ENABLED=true
GRID_TREND_CHECK_INTERVAL=3600
GRID_DEFENSE_ENABLED=true
GRID_DEFENSE_LEVEL1_PCT=10
GRID_DEFENSE_LEVEL2_PCT=15
GRID_DEFENSE_LEVEL3_PCT=20
GRID_REBALANCE_ENABLED=true
GRID_REBALANCE_BOUNDARY_PCT=90
GRID_REBALANCE_MIN_INTERVAL_HOURS=4
GRID_TRAILING_ENABLED=true
GRID_TRAILING_HOLD_PCT=30
GRID_HYBRID_ENABLED=true
GRID_HYBRID_MARKET_BUY_PCT=10
GRID_MIN_TOTAL_ALLOCATION_USD=10
GRID_COIN_MIN_ALLOCATION_USD=5
GRID_DYNAMIC_SPACING_ENABLED=true
GRID_ATR_SPACING_MULTIPLIER=0.4
GRID_REVERSE_ENABLED=true
GRID_REVERSE_TREND_THRESHOLD=65
GRID_MULTI_TF_ENABLED=true
GRID_POST_ONLY=true
GRID_BB_RANGE_ENABLED=true
GRID_BB_RANGE_MARGIN=1.01
GRID_NO_FILL_REBALANCE_ENABLED=true
GRID_NO_FILL_HOURS=6
GRID_DYNAMIC_COUNT_ENABLED=true
GRID_DYNAMIC_COUNT_MIN=8
GRID_DYNAMIC_COUNT_MAX=25
GRID_HYBRID_TREND_ENABLED=true
GRID_HYBRID_TREND_UP_PCT=70
GRID_HYBRID_TREND_DOWN_PCT=30
GRID_ETH_ATR_MULTIPLIER=0.7
GRID_ETH_GRID_COUNT=24
GRID_ETH_RANGE_PCT=4
GRID_ETH_HYBRID_PCT=10
GRID_ETH_NO_FILL_HOURS=4
GRID_BTC_ATR_MULTIPLIER=0.65
GRID_BTC_GRID_COUNT=24
GRID_BTC_RANGE_PCT=0
GRID_BTC_USE_BB_RANGE=true
GRID_BTC_HYBRID_PCT=10
GRID_BTC_NO_FILL_HOURS=8
GRID_REBALANCE_ENABLED=true
GRID_REBALANCE_USDT_PCT=30
GRID_REBALANCE_TOLERANCE_PCT=5
GRID_REBALANCE_MIN_USD=20
GRID_REBALANCE_INTERVAL_HOURS=4
GRID_ETH_USE_BB_RANGE=true
GRID_REINVEST_ENABLED=true
GRID_REINVEST_MODE=compound
GRID_REINVEST_MIN_PROFIT=20
GRID_REINVEST_PCT=80
GRID_REINVEST_CHECK_HOURS=6
GRID_REINVEST_MAX_PER_CYCLE=200
GRID_USDT_ONLY_BUY_MODE=true
GRID_MAX_DAILY_LOSS=20
GRID_ATR_DYNAMIC=true
GRID_ATR_PERIOD=14
GRID_ATR_TIMEFRAME=1h
GRID_MIN_SPACING_PCT=0.4
GRID_MAX_SPACING_PCT=2.0
GRID_ATR_RECALC_INTERVAL=3600
GRID_RESPACING_THRESHOLD=15
GRID_TREND_SHIFT_ENABLED=true
GRID_MAX_SHIFT_PCT=0.3
GRID_MIN_BUY_GRIDS=4
GRID_MIN_SELL_GRIDS=4
GRID_AUTO_REBALANCE_ENABLED=true
GRID_REBALANCE_COIN_MAX_PCT=70
GRID_REBALANCE_TARGET_COIN_PCT=65
GRID_REBALANCE_CHECK_INTERVAL_SEC=3600
```

---

## 📊 현재 봇 운영 상태

```
총 자본: $3,659.54
코인:USDT = 86:0
누적 수익: $50.31
누적 거래: ETH 321건 / BTC 127건
ETH: 간격 $3.82 (0.19%) | 범위 $2,007~$2,099
BTC: 간격 $125.07 (0.19%) | 범위 $65,406~$68,408
```

---

## ⚠️ 지시서 작성 시 주의사항

- **취소+재배치**: `_atr_respace_coin(coin_bot: CoinBot)` — symbol 아닌 CoinBot 객체 받음
- **전체 취소**: `_cancel_open_orders_for_config_symbols(stage: str)` — 모든 심볼 한번에
- **코인 루프**: `for coin_bot in self.coin_bots:` — `coin_configs` 없음
- **추세 신호**: `self.trend_signals[coin_bot.name]` → TrendSignal 객체 (1시간마다 자동 갱신)
- **그리드 모드**: `coin_bot.optimizer_mode` = "normal" / "reverse_up" / "defensive"
- **투자금 수정**: `coin_bot.config.investment` — 줄이면 안 됨 (복리 버그 수정 완료)
- **절대 건드리지 말 것**: bot.py, exchange.py, .env (API 키), portfolio.json
