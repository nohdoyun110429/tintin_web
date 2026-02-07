-- ============================================
-- NO MERCY 웹사이트 - 결제 내역 테이블 설정
-- ============================================
-- 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 아래 전체 SQL을 복사하여 붙여넣기
-- 4. Run 버튼 클릭
-- ============================================

-- 결제 내역 테이블 생성
CREATE TABLE IF NOT EXISTS payments (
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
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_number ON payments(order_number);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 내역만 조회 가능
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 결제 내역만 생성 가능
CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 설정 완료!
-- 이제 웹사이트에서 결제하면 DB에 저장됩니다.
-- ============================================

