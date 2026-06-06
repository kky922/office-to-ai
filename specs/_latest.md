🤖 DePIN 노드 확장판 — Cursor 작업지시서
DAWN Protocol / Gradient Network / Teneo Protocol / OpenLoop
기존 DePIN 봇 (Grass + Rivalz) 에 4개 노드 추가 통합
맥미니 24/7 환경 최적화 | Playwright 크롬 자동화 기반

📌 Cursor 지시서 #1 — 프로젝트 구조 확장


[Cursor 지시 #1 — 기존 DePIN 봇에 4개 노드 추가]
nodes:
  dawn:
    enabled: true
    email: "${DAWN_EMAIL}"
    password: "${DAWN_PASSWORD}"
    extension_id: "fpdkjdnhkakefebpekbdhillbhonfjjp"
    method: "playwright"

  gradient:
    enabled: true
    email: "${GRADIENT_EMAIL}"
    password: "${GRADIENT_PASSWORD}"
    extension_id: "caacbgbklghmpodbdafajbgdnegacfmo"
    method: "playwright"

  teneo:
    enabled: true
    email: "${TENEO_EMAIL}"
    password: "${TENEO_PASSWORD}"
    extension_id: "emcclcoaglgcpoognfiggmhnhgabppkm"
    method: "playwright"
    ws_url: "wss://secure.protocol.teneo.pro"

  openloop:
    enabled: true
    email: "${OPENLOOP_EMAIL}"
    password: "${OPENLOOP_PASSWORD}"
    wallet_address: "${OPENLOOP_WALLET}"
    method: "playwright_or_cli"

.env.example에 아래 추가:
# ── DAWN Protocol ────────────────────────────
DAWN_EMAIL=your_email@gmail.com
DAWN_PASSWORD=your_password

# ── Gradient Network ─────────────────────────
GRADIENT_EMAIL=your_email@gmail.com
GRADIENT_PASSWORD=your_password

# ── Teneo Protocol ───────────────────────────
TENEO_EMAIL=your_email@gmail.com
TENEO_PASSWORD=your_password

# ── OpenLoop ─────────────────────────────────
OPENLOOP_EMAIL=your_email@gmail.com
OPENLOOP_PASSWORD=your_password
OPENLOOP_WALLET=0x...

requirements.txt에 아래 추가 (없으면):
websockets==12.0
playwright==1.44.0
playwright-stealth==1.0.6
📌 Cursor 지시서 #2 — DAWN Protocol 노드 구현


[Cursor 지시 #2 — DAWN Protocol 노드 완전 구현]
       - 연결 인디케이터 초록색 확인
       - "Connected" 텍스트 감지
       - 포인트 잔액 텍스트 파싱

    ⑤ 브라우저 백그라운드 유지:
       - 탭 활성 상태 유지
       - 30분마다 페이지 새로고침 (연결 유지)
       - 연결 끊김 감지 시 자동 재연결

    방법 2: API 직접 연결 (폴백)

    ① DAWN API 로그인:
       POST https://api.dawninternet.com/api/v1/auth/login
       Body: {email, password}
       → Bearer 토큰 획득

    ② 노드 등록:
       POST https://api.dawninternet.com/api/v1/node/register
       Headers: Authorization: Bearer {token}

    ③ 하트비트 유지 (5분 간격):
       POST https://api.dawninternet.com/api/v1/node/heartbeat
       Body: {node_id, bandwidth_mbps, uptime_seconds}

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_status() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ① 브라우저 프로세스 실행 중인지 확인 (psutil)
    ② 확장 팝업에서 상태 텍스트 파싱
    ③ API 호출로 포인트 잔액 조회
    ④ 반환값:
       {
         'status': 'running' or 'stopped' or 'error',
         'connected': bool,
         'uptime_hours': float,
         'today_points': float,
         'total_points': float,
         'bandwidth_shared_mb': float,
         'last_heartbeat': datetime
       }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_earnings() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ① DAWN API에서 포인트 잔액 조회
    ② 포인트 → USD 환산
       (config의 dawn_point_to_usd 환율 사용)
    ③ DB에 EarningsRecord 저장
    ④ 반환값:
       {
         'points_today': float,
         'points_total': float,
         'usd_estimate': float,
         'last_updated': datetime
       }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    _keep_alive() 구현 (백그라운드 태스크):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    while True:
        ① 연결 상태 체크 (30분마다)
        ② 끊김 감지 시 자동 재연결
        ③ 페이지 새로고침으로 세션 유지
        ④ 재연결 실패 3회 시 텔레그램 알림

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    setup_autostart_macos() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    LaunchAgent plist 생성:
    ~/Library/LaunchAgents/com.dawninternet.node.plist
    - RunAtLoad: true
    - KeepAlive: true
    - 로그: /tmp/dawn_node.log
📌 Cursor 지시서 #3 — Gradient Network 노드 구현


[Cursor 지시 #3 — Gradient Network 노드 완전 구현]

nodes/gradient_node.py를 완전 구현해줘.
BaseNode를 상속하는 Gradient Network 자동화 클래스야.

공식 정보:
- 사이트: app.gradient.network
- 방식: Chrome 확장 프로그램 또는 독립 앱
- 확장 ID: caacbgbklghmpodbdafajbgdnegacfmo
- 원리: 대역폭 + 컴퓨팅 자원 공유 → $GRAD 포인트
- 현재: Season 0 진행 중 (2025년 검색 확인)

class GradientNode(BaseNode):

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    start() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    방법 1: 독립 앱 방식 (macOS 우선)

    ① Gradient 독립 앱 설치 확인:
       /Applications/Gradient.app 존재 여부
    
    ② 없으면 자동 다운로드:
       URL: https://gradient.network/downloads/mac
       .dmg 파일 다운로드 → 자동 설치
    
    ③ 앱 실행:
       subprocess.Popen(['open', '-a', 'Gradient'])
    
    ④ 앱 내 자동 로그인:
       - Playwright로 앱 UI 접근 또는
       - 설정 파일에 자격증명 주입
    
    ⑤ 실행 확인 (psutil로 프로세스 체크)

    방법 2: Playwright 크롬 확장 방식 (폴백)

    ① Playwright 크롬 실행 (stealth 적용)
       args=['--load-extension=gradient_ext_path']
    
    ② 확장 팝업 접속:
       chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html
    
    ③ 계정 로그인:
       - 이메일/비밀번호 자동 입력
       - "Connect" 버튼 클릭
       - 연결 상태 확인
    
    ④ app.gradient.network 접속:
       - 대시보드 로드 확인
       - 포인트 잔액 파싱
       - 노드 상태 초록색 확인
    
    ⑤ 세션 유지 (30분마다 새로고침)

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_status() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ① 앱 또는 브라우저 프로세스 확인
    ② Gradient API 호출:
       GET https://api.gradient.network/v1/node/status
       Headers: Authorization: Bearer {token}
    ③ 반환값:
       {
         'status': 'running' or 'stopped',
         'connected': bool,
         'uptime_hours': float,
         'today_points': float,
         'total_points': float,
         'season': 'Season 0',
         'rank': int (리더보드 순위),
         'last_updated': datetime
       }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_earnings() 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ① Gradient API에서 $GRAD 포인트 조회
    ② USD 환산 (TGE 전이므로 추정값 사용)
    ③ DB 저장
    ④ 반환:
       {
         'grad_points_today': float,
         'grad_points_total': float,
         'usd_estimate': float,
         'season_rank': int
       }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    하드웨어 최적화 구현:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    optimize_for_macos_m4():
    - 맥미니 M4 성능 최대 활용
    - CPU: 여유 코어 자동 감지
    - 대역폭: 현재 속도 측정 후 제공량 설정
    - 배터리 모드 감지 → 전원 연결 시 풀 성능
📌 Cursor 지시서 #4 — Teneo Protocol 노드 구현


[Cursor 지시 #4 — Teneo Protocol 노드 완전 구현]
        while self.running:
            try:
                async with websockets.connect(
                    self.WS_URL,
                    extra_headers={
                        'Authorization': f'Bearer {self.token}',
                        'User-Agent': self.user_agent,
                        'Origin': f'chrome-extension://{self.EXT_ID}'
                    }
                ) as ws:
                    self.ws = ws
                    retry_count = 0
                    self.logger.info("✅ Teneo WS 연결 성공")

                    # 연결 확인 메시지 수신
                    msg = json.loads(await ws.recv())
                    if msg.get('type') == 'CONNECTED':
                        self.today_points = msg.get('points_today', 0)

                    # Ping/Pong 루프
                    while True:
                        ping = {
                            "type": "PING",
                            "id": str(uuid.uuid4())
                        }
                        await ws.send(json.dumps(ping))

                        pong = json.loads(await ws.recv())
                        if pong.get('type') == 'PONG':
                            self.today_points = pong.get('points', 0)
                            self.total_points = pong.get('total_points', 0)

                        await asyncio.sleep(30)

            except (websockets.exceptions.ConnectionClosed,
                    ConnectionRefusedError) as e:
                retry_count += 1
                delay = min(2 ** retry_count, 300)
                self.logger.warning(
                    f"⚠️ Teneo 연결 끊김 (시도 {retry_count}회) "
                    f"→ {delay}초 후 재연결"
                )
                await asyncio.sleep(delay)

            except Exception as e:
                self.logger.error(f"❌ Teneo 오류: {e}")
                await asyncio.sleep(60)

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_status() 반환값:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      'status': 'running' or 'stopped',
      'ws_connected': bool,
      'today_points': float,
      'total_points': float,
      'last_ping': datetime,
      'uptime_hours': float,
      'reconnect_count': int
    }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_earnings() 반환값:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      'teneo_points_today': float,
      'teneo_points_total': float,
      'usd_estimate': float
    }
📌 Cursor 지시서 #5 — OpenLoop 노드 구현


[Cursor 지시 #5 — OpenLoop 노드 완전 구현]

    ② OpenLoop Sentry 노드 설치:
       subprocess.run([
           'npm', 'install', '-g',
           '@openloop/sentry-node'
       ])

    ③ 지갑 주소로 노드 등록:
       subprocess.run([
           'openloop-sentry',
           '--wallet', config['openloop']['wallet_address'],
           '--email', config['openloop']['email']
       ])

    ④ 노드 시작:
       self.process = subprocess.Popen(
           ['openloop-sentry', 'start'],
           stdout=log_file,
           stderr=log_file
       )

    ⑤ 프로세스 PID 저장 → 관리

    방법 선택 로직:
    ─────────────────────────────────────────
    if config['openloop']['method'] == 'cli':
        → Node.js CLI 방식 실행
    else:
        → Playwright 크롬 확장 방식 실행
    둘 다 실패 시 → 텔레그램 오류 알림

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_status() 반환값:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      'status': 'running' or 'stopped',
      'method': 'playwright' or 'cli',
      'process_pid': int (CLI 방식),
      'connected': bool,
      'today_open': float,
      'total_open': float,
      'profit_share_usd': float,
      'uptime_hours': float
    }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    get_earnings() 반환값:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      'open_tokens_today': float,
      'open_tokens_total': float,
      'profit_share_today': float,
      'usd_total': float
    }

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    맥미니 LaunchAgent 설정:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    setup_autostart_macos():
    ① plist 파일 생성:
       ~/Library/LaunchAgents/so.openloop.node.plist
    ② CLI 방식: openloop-sentry start 자동 실행
    ③ 크래시 시 자동 재시작
📌 Cursor 지시서 #6 — 통합 스케줄러 업데이트


[Cursor 지시 #6 — 스케줄러에 4개 노드 추가 통합]

core/scheduler.py를 수정해서
기존 Grass + Rivalz에 DAWN + Gradient + Teneo + OpenLoop를
추가 통합해줘.

수정 내용:

1. __init__() 업데이트:
   기존:
   self.nodes = {
       'grass':   GrassNode(config),
       'nodepay': NodepayNode(config),
       'rivalz':  RivalzNode(config),
   }

   수정:
   self.nodes = {}
   node_map = {
       'grass':    (GrassNode,    config.nodes.grass.enabled),
       'rivalz':   (RivalzNode,   config.nodes.rivalz.enabled),
       'dawn':     (DAWNNode,     config.nodes.dawn.enabled),
       'gradient': (GradientNode, config.nodes.gradient.enabled),
       'teneo':    (TeneoNode,    config.nodes.teneo.enabled),
       'openloop': (OpenLoopNode, config.nodes.openloop.enabled),
   }
   for name, (NodeClass, enabled) in node_map.items():
       if enabled:
           self.nodes[name] = NodeClass(config)

2. send_daily_report() 업데이트:
   기존 3개 → 6개 노드 수익 합산 표시

   텔레그램 리포트 포맷:
   "📊 DePIN 일별 수익 리포트
    ─────────────────────────
    🌿 Grass:     X pts  ($X.XX)
    ⚙️ Rivalz:    X RIZ  ($X.XX)
    🌅 DAWN:      X pts  ($X.XX)
    📶 Gradient:  X pts  ($X.XX)
    🌀 Teneo:     X pts  ($X.XX)
    🔄 OpenLoop:  X OPEN ($X.XX)
    ─────────────────────────
    💰 총 수익:   $X.XX
    ⏱️ 가동 시간: XX시간
    🖥️ 맥미니 상태: 정상"

3. health_check_all() 업데이트:
   6개 노드 모두 헬스체크
   실패 노드 자동 재시작
   재시작 3회 실패 시 해당 노드 알림

4. collect_all_earnings() 업데이트:
   6개 노드 수익 합산
   노드별 개별 DB 저장
📌 Cursor 지시서 #7 — 텔레그램 명령어 업데이트


[Cursor 지시 #7 — 텔레그램 명령어 6개 노드 반영]

monitor/telegram_bot.py를 수정해서
6개 노드 관리 명령어를 추가해줘.

추가/수정할 명령어:

/status
  → 6개 노드 현재 상태 표시
  이모지:
  🌿 Grass    ⚙️ Rivalz
  🌅 DAWN     📶 Gradient
  🌀 Teneo    🔄 OpenLoop

/earnings
  → 오늘 노드별 수익 + 합계

/dawn_status
  → DAWN 노드 상세 상태
  → 포인트 잔액, 연결 상태, 대역폭

/gradient_status
  → Gradient 노드 상세 상태
  → Season 0 포인트, 리더보드 순위

/teneo_status
  → Teneo WS 연결 상태
  → 오늘 포인트, 총 포인트

/openloop_status
  → OpenLoop 노드 상태
  → 수익 공유 현황

/restart_dawn
/restart_gradient
/restart_teneo
/restart_openloop
  → 개별 노드 재시작

/all_nodes
  → 전체 6개 노드 한눈에 보기
  → 수익 합산 + 상태 요약
📌 Cursor 지시서 #8 — DB 모델 업데이트


[Cursor 지시 #8 — DB 모델에 4개 노드 추가]

core/database.py의 EarningsRecord 테이블에
DAWN / Gradient / Teneo / OpenLoop 단위 추가:

unit 필드 허용값 업데이트:
기존: GRASS, NC, RIZ
추가: DAWN_POINTS, GRAD_POINTS, TENEO_POINTS, OPEN

DailyReport 테이블에 컬럼 추가:
기존:
  grass_earnings, nodepay_earnings, rivalz_earnings

수정:
  grass_earnings    REAL DEFAULT 0,
  rivalz_earnings   REAL DEFAULT 0,
  dawn_earnings     REAL DEFAULT 0,  ← 추가
  gradient_earnings REAL DEFAULT 0,  ← 추가
  teneo_earnings    REAL DEFAULT 0,  ← 추가
  openloop_earnings REAL DEFAULT 0,  ← 추가
  total_usd         REAL DEFAULT 0

마이그레이션 스크립트 작성:
scripts/migrate_db.py:
  - 기존 DB에 새 컬럼 ALTER TABLE로 추가
  - 기존 데이터 보존
  - 마이그레이션 성공 로그 출력
📌 Cursor 지시서 #9 — 맥미니 통합 세팅 스크립트 업데이트


[Cursor 지시 #9 — 맥미니 세팅 스크립트 전체 업데이트]

scripts/setup_macos.sh를 수정해서
6개 노드 전체 세팅을 한 번에 완료하도록 업데이트해줘.

추가할 내용:

1. Playwright 크롬 설치 확인:
   playwright install chromium
   playwright install-deps chromium

2. 크롬 확장 프로그램 자동 다운로드:
   각 확장 ID로 CRX 파일 다운로드
   extensions/
   ├── dawn_extension/
   ├── gradient_extension/
   ├── teneo_extension/
   └── openloop_extension/

3. OpenLoop Node.js CLI 설치:
   npm install -g @openloop/sentry-node

4. 6개 노드 LaunchAgent 등록:
   ① com.dawninternet.node.plist
   ② ai.gradient.node.plist
   ③ pro.teneo.node.plist
   ④ so.openloop.node.plist
   (Grass, Rivalz는 기존 plist 유지)

5. 완료 메시지:
   echo "✅ 6개 DePIN 노드 세팅 완료!"
   echo ""
   echo "🌿 Grass    → 크롬 확장 실행 중"
   echo "⚙️ Rivalz   → rClient 실행 중"
   echo "🌅 DAWN     → 크롬 확장 실행 중"
   echo "📶 Gradient → 앱/확장 실행 중"
   echo "🌀 Teneo    → WebSocket 연결 중"
   echo "🔄 OpenLoop → 노드 실행 중"
   echo ""
   echo "📱 텔레그램에서 /status 로 확인하세요!"

scripts/check_status.sh 업데이트:
   6개 노드 프로세스 상태 모두 출력
📌 Cursor 지시서 #10 — 통합 테스트 작성


[Cursor 지시 #10 — 4개 신규 노드 테스트 작성]

tests/ 폴더에 아래 테스트 파일을 추가해줘.

tests/test_dawn.py:
  ① DAWNNode 초기화 테스트
  ② Playwright 실행 테스트 (Mock)
  ③ API 로그인 테스트 (Mock)
  ④ 포인트 조회 테스트
  ⑤ 재연결 로직 테스트
  ⑥ LaunchAgent 생성 테스트

tests/test_gradient.py:
  ① GradientNode 초기화 테스트
  ② 앱 실행 테스트 (Mock)
  ③ 크롬 확장 폴백 테스트
  ④ Season 0 포인트 조회 테스트
  ⑤ 하드웨어 최적화 테스트

tests/test_teneo.py:
  ① TeneoNode 초기화 테스트
  ② WebSocket 연결 테스트 (Mock)
  ③ Ping/Pong 루프 테스트
  ④ 포인트 파싱 테스트
  ⑤ 재연결 지수 백오프 테스트
  ⑥ 크롬 확장 폴백 테스트

tests/test_openloop.py:
  ① OpenLoopNode 초기화 테스트
  ② Playwright 방식 테스트 (Mock)
  ③ Node.js CLI 방식 테스트 (Mock)
  ④ 방법 자동 선택 테스트
  ⑤ 수익 공유 계산 테스트

tests/test_scheduler_extended.py:
  ① 6개 노드 동시 시작 테스트
  ② 통합 수익 집계 테스트
  ③ 텔레그램 리포트 포맷 테스트

실행 명령:
pytest tests/ -v --asyncio-mode=auto
pytest tests/test_teneo.py -v  # Teneo만 테스트
📋 최종 환경변수 통합 (.env.example 전체)
env

