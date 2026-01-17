# DB 수정 가이드

이 폴더에는 Supabase 데이터베이스 설정 및 수정을 위한 SQL 파일들이 있습니다.

## 📁 파일 목록

### 1. `supabase_setup.sql` (기존)
- `payments` 테이블 생성
- 현재 코드에서 사용 중인 테이블

### 2. `supabase_orders_setup.sql` (새로 생성)
- `orders` 테이블 생성
- `payments` 대신 `orders` 테이블을 사용하고 싶을 때 사용

### 3. `supabase_migrate_payments_to_orders.sql` (새로 생성)
- 기존 `payments` 테이블의 데이터를 `orders` 테이블로 마이그레이션
- 기존 데이터를 유지하면서 테이블 이름을 변경하고 싶을 때 사용

## 🚀 사용 방법

### 방법 1: Supabase 대시보드에서 실행

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 원하는 SQL 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI로 SQL 실행
supabase db execute -f supabase_orders_setup.sql
```

## 📋 시나리오별 가이드

### 시나리오 1: 처음 설정하는 경우
→ `supabase_setup.sql` 또는 `supabase_orders_setup.sql` 사용

### 시나리오 2: payments를 orders로 변경하고 싶은 경우
1. `supabase_migrate_payments_to_orders.sql` 실행
2. 코드에서 `payments`를 `orders`로 변경:
   - `src/pages/MyPage.tsx`
   - `src/pages/PaymentSuccess.tsx`

### 시나리오 3: 테이블 구조를 수정하고 싶은 경우
1. 기존 테이블 구조 확인
2. 필요한 컬럼 추가/수정 SQL 작성
3. `supabase_custom_update.sql` 파일 생성 (예시)

## ⚠️ 주의사항

1. **백업**: 프로덕션 환경에서는 반드시 백업 후 실행
2. **테스트**: 먼저 개발 환경에서 테스트
3. **RLS 정책**: Row Level Security 정책이 올바르게 설정되었는지 확인
4. **인덱스**: 대량 데이터가 있는 경우 인덱스 생성 시 시간이 걸릴 수 있음

## 🔍 테이블 구조 확인

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 특정 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders';
```

## 📝 커스텀 수정 예시

### 컬럼 추가 예시
```sql
-- 예: 결제 수단 추가
ALTER TABLE orders 
ADD COLUMN payment_method TEXT DEFAULT 'CARD';

-- 예: 배송 주소 추가
ALTER TABLE orders 
ADD COLUMN shipping_address JSONB;
```

### 인덱스 추가 예시
```sql
-- 예: status로 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);
```

## 🆘 문제 해결

### 오류: "relation already exists"
→ 테이블이 이미 존재합니다. `IF NOT EXISTS`를 사용하거나 기존 테이블을 확인하세요.

### 오류: "permission denied"
→ RLS 정책을 확인하거나, 관리자 권한으로 실행하세요.

### 오류: "duplicate key value"
→ `order_number`가 중복되었습니다. UNIQUE 제약 조건을 확인하세요.

