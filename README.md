# Office to AI

Office 문서와 PDF를 AI 채팅에 붙여넣기 쉬운 Markdown 청크로 변환합니다.
브라우저에서 로컬 변환하거나 Python CLI로 폴더를 일괄 처리할 수 있습니다.

## 기능

- `.xlsx`, `.docx`, `.pptx`, `.pdf` 지원
- 제목, 표, 시트 구조를 Markdown으로 보존
- 토큰 수 기준 자동 분할과 선택적 청크 오버랩
- 이미지 추출, 자리표시자, 제외 모드
- 웹 버전은 파일을 서버로 업로드하지 않고 브라우저 안에서 처리

## 설치

```bash
git clone https://github.com/kky922/office-to-ai.git
cd office-to-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

웹 버전은 별도 설치 없이 `web/index.html`을 브라우저에서 열면 됩니다.

## 설정

API 키나 계정 설정은 필요하지 않습니다. CLI 출력 기본 위치는 `./out`입니다.

## 실행

```bash
# 단일 파일
python -m code.converter report.xlsx

# 폴더 안의 Word 문서만 변환
python -m code.converter ./documents --glob "*.docx" -o ./out

# 큰 모델용 청크와 문맥 오버랩
python -m code.converter slides.pptx --max-tokens 16000 --overlap 500
```

입력 표:

```text
이름 | 부서 | 입사년도
민수 | 개발 | 2024
```

변환 결과:

```markdown
## 시트: Sheet1

| 이름 | 부서 | 입사년도 |
| --- | --- | --- |
| 민수 | 개발 | 2024 |
```

결과는 `out/<파일명>/index.md`, `chunk_01.md` 형태로 저장됩니다.

## 테스트

```bash
pytest -q
```

## 주의사항

- 암호화된 문서와 손상된 파일은 지원하지 않습니다.
- 복잡한 도형, 애니메이션, 수식의 시각적 배치는 완전히 재현되지 않을 수 있습니다.
- 민감한 문서는 웹 버전 또는 신뢰할 수 있는 로컬 환경에서 처리하세요.

설계 원칙은 [docs/design.md](docs/design.md)에 정리되어 있습니다.

## 라이선스

MIT
