# Office → AI 붙여넣기 변환기

Excel · Word · PowerPoint · PDF 대용량 파일을 **Claude/ChatGPT 채팅창에 바로 붙여넣을 수 있는 마크다운 청크**로 분할 변환합니다. 원본의 시트·헤딩·슬라이드·페이지 구조를 최대한 보존합니다.

두 가지 방식으로 사용할 수 있습니다.

| 방식 | 대상 | 설치 필요 | 네트워크 전송 |
| --- | --- | --- | --- |
| **웹 대시보드 (기본)** | 회사 PC 누구나 | 없음 (브라우저만) | 없음 (로컬 처리) |
| **Python CLI (고급)** | 자동화 파이프라인, 초대용량 | Python 3.10+ | 없음 |

---

## 1. 웹 대시보드 — 설치 없이 바로 사용

1. `web/` 폴더를 사내 파일서버·SharePoint에 올리거나, 로컬에 복사한 뒤 `web/index.html`을 더블클릭해 브라우저에서 엽니다.
2. Excel/Word/PowerPoint/PDF 파일을 드롭존으로 끌어다 놓습니다.
3. 청크 카드가 생성되면 **[복사]** 버튼으로 클립보드에 담아 Claude/ChatGPT 채팅창에 붙여넣습니다.
4. 필요하면 **[ZIP 다운로드]** 로 `index.md` + `chunk_NN.md` + `images/` 를 한 번에 받습니다.

### 보안 특성
- 모든 파싱·변환은 브라우저 JS 안에서만 수행됩니다. 파일이 외부 서버로 나가지 않습니다.
- 외부 CDN(SheetJS, mammoth, pdf.js 등)에서 라이브러리를 내려받지만, **변환 대상 파일은 CDN으로 전송되지 않습니다**. 인트라넷만 가능한 환경이라면 `web/lib/` 하위에 해당 파일들을 직접 넣어두고 `index.html`의 `<script src>` 경로를 바꿔주세요.

### 브라우저에서의 한계
- 매우 큰 xlsx(수백 MB) · 100장 이상 pptx에서는 메모리 부족이 생길 수 있습니다 → Python CLI 사용을 권장합니다.
- PDF의 이미지 추출은 제한적입니다(텍스트 위주).
- 복잡한 SmartArt/차트의 일부 텍스트는 누락될 수 있습니다.

---

## 2. Python CLI — 자동화·고충실도 변환

### 설치
```bash
pip install -r requirements.txt
```

### 기본 사용
```bash
python -m code.converter FILE [FILE ...] [옵션]
```

예:
```bash
# 단일 파일
python -m code.converter report.xlsx -o ./out

# 디렉터리의 특정 확장자만
python -m code.converter ./docs -o ./out --glob "*.pptx"

# 큰 모델용으로 청크 확대
python -m code.converter big.pdf --max-tokens 16000
```

### 주요 옵션
| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `-o, --out` | `./out` | 출력 루트 디렉터리 |
| `--max-tokens` | `8000` | 청크 최대 토큰 |
| `--overlap` | `0` | 청크 간 오버랩 토큰 |
| `--images` | `extract` | `extract` / `placeholder` / `omit` |
| `--sheet-rows` | `200` | Excel 시트 내 행 분할 단위 |
| `--glob` | — | 디렉터리 입력 시 파일 필터 |

### 출력 구조
```
out/
  <파일이름>/
    index.md           # 사용 방법 + 청크 목차
    chunk_01.md        # 청크 1: 순서대로 붙여넣기
    chunk_02.md
    ...
    images/            # 추출된 이미지 (word / pptx / pdf)
```

### 충실도 원칙
- Excel: `## 시트: 이름` + 행 구간별 마크다운 표. 시트가 크면 `--sheet-rows` 단위로 자동 분할됩니다.
- Word: H1~H6·리스트·표 보존. 이미지는 `images/` 하위로 추출 + 참조.
- PowerPoint: 슬라이드마다 `---` + `### 슬라이드 N: 제목`, 본문·이미지·발표자 노트(`> 노트:`) 분리.
- PDF: 페이지마다 `### 페이지 N` + 추출 텍스트.

---

## 테스트

```bash
python -m pytest code/tests -q
```

`code/tests/conftest.py` 가 openpyxl·python-docx·python-pptx·reportlab을 이용해 미니 Office·PDF 픽스처를 **코드로** 생성합니다. 외부 샘플 파일이 없어도 테스트가 동작합니다.

---

## 범위 밖 (향후)
- OCR(스캔 PDF, 이미지 내 텍스트)
- 레거시 바이너리 포맷(`.doc` / `.ppt` / `.xls`) — LibreOffice 변환 필요
- SmartArt/복잡 차트 완전 재현, 변경이력·주석
- PyInstaller 단일 `.exe` 빌드, SSO·다중 사용자 서버 배포
