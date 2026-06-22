# SilverRoom

SilverRoom은 `.txt`와 `.md` 문서를 업로드해 버전과 댓글을 한 화면에서 확인하는 개인용 문서 리뷰룸입니다.

내가 공동작업할 때 쓰려고 만든 웹뷰어입니다.

작성은 익숙한 도구에서, 검토는 SilverRoom에서.

## 주요 기능

- 입장 코드와 지정 닉네임 기반 입장
- `.txt`, `.md` 파일 업로드, 2MB 제한
- 현재 문서 뷰어와 파일 히스토리
- 이미 올라간 문서 내용 수정
- 다운로드 시 한글 파일명 유지
- 줄 앞 `//` 입력 시 연한 보라색 주석 블록 표시
- 50줄, 100줄, 200줄 단위 페이지 넘기기
- 파일별 댓글 작성, 삭제, 해결 토글
- 댓글 태그: 기본, 수정요청, 아이디어, 확인필요
- 업로드 목록에서 댓글 총개수와 미해결 개수 표시

## 기술 스택

- Spring Boot 3.x, Java 17
- Spring Web, Spring Data JPA, H2 file DB
- HTML/CSS/Vanilla JavaScript
- Gradle
- Docker, Docker Compose

## 로컬 실행

```bash
cp .env.example .env
APP_ACCESS_CODE=1234 gradle bootRun
```

Windows PowerShell:

```powershell
$env:APP_ACCESS_CODE="1234"
gradle bootRun
```

기본 주소는 `http://localhost:8080`입니다.

## Docker 실행

```bash
cp .env.example .env
docker compose up -d --build
```

종료:

```bash
docker compose down
```

데이터는 기존 배포와의 호환을 위해 `gongmodoc_data` Docker volume의 `/app/data`에 저장됩니다.

## 환경변수

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `APP_ACCESS_CODE` | 입장 코드 | `1234` |
| `SERVER_PORT` | 외부에 노출할 포트 | `8080` |
| `APP_DATA_DIR` | H2 DB 저장 경로 | `./data`, Docker는 `/app/data` |
| `TZ` | 컨테이너 시간대 | `Asia/Seoul` |

## API 요약

- `POST /api/auth/login`: 입장 코드와 닉네임으로 로그인
- `GET /api/files/current`: 현재 파일 조회
- `POST /api/files/upload`: `.txt`, `.md` 파일 업로드
- `GET /api/files`: 파일 목록 최신순 조회
- `GET /api/files/{fileId}`: 특정 파일 내용 조회
- `PUT /api/files/{fileId}`: 기존 파일 내용 수정
- `POST /api/files/{fileId}/restore`: 이전 파일을 현재 문서로 복원
- `DELETE /api/files/{fileId}`: 이전 파일 삭제
- `GET /api/files/{fileId}/download?format=txt`: 텍스트 다운로드
- `GET /api/files/{fileId}/comments?sort=asc`: 파일별 댓글 조회
- `POST /api/files/{fileId}/comments`: 댓글 작성
- `PATCH /api/comments/{commentId}/resolve`: 해결 상태 토글
- `DELETE /api/comments/{commentId}`: 댓글 삭제

로그인 이후 API 요청에는 `X-GongmoDoc-Token` 헤더가 필요합니다. 이 헤더명은 기존 배포 호환을 위해 유지합니다.

## VPS 배포 예시

```bash
git clone <repo-url> GongmoDoc
cd GongmoDoc
cp .env.example .env
vi .env
docker compose up -d --build
```

Caddy나 Nginx를 붙일 때는 reverse proxy 대상을 `http://127.0.0.1:8080`으로 두면 됩니다.
