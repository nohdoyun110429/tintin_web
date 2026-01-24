-- ============================================
-- NO MERCY 웹사이트 - payments 테이블을 orders로 마이그레이션
-- ============================================
-- 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 아래 전체 SQL을 복사하여 붙여넣기
-- 4. Run 버튼 클릭
-- 
-- 주의: 이 스크립트는 기존 payments 테이블의 데이터를 orders 테이블로 복사합니다.
-- ============================================

-- 1. orders 테이블 생성 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 3. 기존 payments 테이블의 데이터를 orders로 복사
INSERT INTO orders (id, user_id, order_number, amount, status, items, created_at, updated_at)
SELECT id, user_id, order_number, amount, status, items, created_at, updated_at
FROM payments
ON CONFLICT (order_number) DO NOTHING;

-- 4. RLS 정책 설정
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

-- 새 정책 생성
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. updated_at 트리거 설정
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 마이그레이션 완료!
-- 
-- 다음 단계:
-- 1. 코드에서 'payments'를 'orders'로 변경
-- 2. (선택사항) 기존 payments 테이블 삭제:
--    DROP TABLE IF EXISTS payments CASCADE;
-- ============================================


