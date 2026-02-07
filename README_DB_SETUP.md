# Supabase 데이터베이스 설정 가이드

## 결제 내역 테이블 설정 방법

### 1단계: Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택

### 2단계: SQL Editor 열기
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### 3단계: SQL 실행
1. `supabase_setup.sql` 파일을 열어서 **전체 내용을 복사**
2. SQL Editor에 **붙여넣기**
3. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### 4단계: 확인
- 성공 메시지가 표시되면 완료!
- Table Editor에서 `payments` 테이블이 생성되었는지 확인

## 테이블 구조

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 고유 ID (자동 생성) |
| user_id | UUID | 사용자 ID (auth.users 참조) |
| order_number | TEXT | 주문번호 (고유값) |
| amount | INTEGER | 결제 금액 |
| status | TEXT | 결제 상태 (completed/pending/cancelled) |
| items | JSONB | 구매한 상품 목록 (JSON 형식) |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

## 보안 설정

- **RLS (Row Level Security)** 활성화
- 사용자는 자신의 결제 내역만 조회/생성 가능
- 다른 사용자의 데이터는 접근 불가

## 문제 해결

### 에러: "relation already exists"
- 테이블이 이미 존재하는 경우입니다
- `DROP TABLE IF EXISTS payments CASCADE;` 실행 후 다시 시도

### 에러: "permission denied"
- RLS 정책이 제대로 설정되지 않았을 수 있습니다
- SQL을 다시 실행해보세요

