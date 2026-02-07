# Supabase Edge Function 설정 가이드

## 📋 토스페이먼츠 결제 승인 함수 (`approve-payment`)

### 🚀 배포 방법

#### 방법 1: Supabase CLI 사용 (권장)

1. **Supabase CLI 설치**
   ```bash
   npm install -g supabase
   ```

2. **Supabase 로그인**
   ```bash
   supabase login
   ```

3. **프로젝트 연결**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   - 프로젝트 ref는 Supabase 대시보드 URL에서 확인 가능
   - 예: `https://cgclempwykvqgtotblpb.supabase.co` → `cgclempwykvqgtotblpb`

4. **시크릿 키 설정**
   ```bash
   supabase secrets set TOSS_SECRET_KEY=test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG
   ```

5. **함수 배포**
   ```bash
   supabase functions deploy approve-payment
   ```

#### 방법 2: Supabase 대시보드 사용

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Edge Functions** 클릭
4. **New Function** 클릭
5. 함수 이름: `approve-payment` 입력
6. `supabase/functions/approve-payment/index.ts` 파일의 내용을 복사하여 붙여넣기
7. **Deploy** 버튼 클릭
8. **Settings** → **Secrets**에서 `TOSS_SECRET_KEY` 추가:
   - Key: `TOSS_SECRET_KEY`
   - Value: `test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG`

### 📝 함수 사용 방법

#### 클라이언트에서 호출 예시

```typescript
import { supabase } from '@/lib/supabase';

const approvePayment = async (
  paymentKey: string,
  orderId: string,
  amount: number,
  orderName: string,
  items: Array<{
    productId: string;
    productName: string;
    productNameKr: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>
) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase.functions.invoke('approve-payment', {
    body: {
      paymentKey,
      orderId,
      amount,
      orderName,
      items,
      userId: session.user.id,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};
```

### 🔐 보안 설정

1. **시크릿 키 관리**
   - 절대 클라이언트 코드에 시크릿 키를 노출하지 마세요
   - Supabase Secrets에만 저장하세요
   - 프로덕션 환경에서는 라이브 키를 사용하세요

2. **인증 확인**
   - 함수는 자동으로 사용자 인증을 확인합니다
   - 인증되지 않은 요청은 거부됩니다

3. **RLS 정책**
   - DB 저장 시 RLS 정책이 자동으로 적용됩니다
   - 사용자는 자신의 결제 내역만 저장할 수 있습니다

### 📊 요청/응답 형식

#### 요청 (Request)

```json
{
  "paymentKey": "tgen_20240117111431_ABCD1234",
  "orderId": "ORD-20260117-114031-VLLAAQ",
  "amount": 10000,
  "orderName": "상품명",
  "items": [
    {
      "productId": "product-1",
      "productName": "Product Name",
      "productNameKr": "상품명",
      "price": 10000,
      "quantity": 1,
      "subtotal": 10000
    }
  ],
  "userId": "user-uuid"
}
```

#### 성공 응답 (Success Response)

```json
{
  "success": true,
  "payment": {
    "paymentKey": "tgen_20240117111431_ABCD1234",
    "orderId": "ORD-20260117-114031-VLLAAQ",
    "orderName": "상품명",
    "totalAmount": 10000,
    "status": "DONE",
    "approvedAt": "2024-01-17T11:14:31+09:00"
  },
  "message": "Payment confirmed successfully"
}
```

#### 오류 응답 (Error Response)

```json
{
  "error": "Payment confirmation failed",
  "details": {
    "code": "ERROR_CODE",
    "message": "오류 메시지"
  }
}
```

### 🔍 테스트 방법

#### 로컬 테스트

```bash
# 로컬에서 함수 실행
supabase functions serve approve-payment

# 다른 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/approve-payment \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_payment_key",
    "orderId": "test-order-123",
    "amount": 10000,
    "orderName": "테스트 상품",
    "items": [],
    "userId": "test-user-id"
  }'
```

### ⚠️ 주의사항

1. **시크릿 키 보안**
   - 테스트 키와 라이브 키를 구분하세요
   - 프로덕션 환경에서는 반드시 라이브 키를 사용하세요

2. **에러 처리**
   - 결제 승인은 성공했지만 DB 저장이 실패한 경우도 처리됩니다
   - 중복 저장 시도는 자동으로 무시됩니다

3. **금액 검증**
   - 클라이언트에서 전달한 금액과 실제 결제 금액을 비교하는 것을 권장합니다
   - 추가 검증이 필요하면 함수 내부에 로직을 추가하세요

### 🐛 문제 해결

#### 오류: "TOSS_SECRET_KEY not configured"
→ Supabase Secrets에 시크릿 키를 설정하세요

#### 오류: "Unauthorized"
→ 클라이언트에서 인증 토큰을 포함하여 요청하세요

#### 오류: "Payment confirmation failed"
→ 토스페이먼츠 API 응답을 확인하세요
→ paymentKey, orderId, amount가 올바른지 확인하세요

### 📚 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [토스페이먼츠 결제 승인 API](https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%8A%B9%EC%9D%B8)


