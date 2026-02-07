-- ============================================
-- NO MERCY 웹사이트 - 주문(orders) 테이블 설정
-- ============================================
-- 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 아래 전체 SQL을 복사하여 붙여넣기
-- 4. Run 버튼 클릭
-- ============================================

-- 주문(orders) 테이블 생성
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  items JSONB NOT NULL, -- 구매한 상품 목록 (JSON 형식)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 주문만 생성 가능
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 업데이트 함수 (이미 존재하면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 설정 완료!
-- 이제 웹사이트에서 결제하면 orders 테이블에 저장됩니다.
-- ============================================


