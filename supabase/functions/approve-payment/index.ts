// ============================================
// 토스페이먼츠 결제 승인 Edge Function
// ============================================
// 함수 이름: approve-payment
// 
// 사용 방법:
// 1. Supabase CLI 설치: npm install -g supabase
// 2. 로그인: supabase login
// 3. 프로젝트 연결: supabase link --project-ref <project-ref>
// 4. 시크릿 키 설정: supabase secrets set TOSS_SECRET_KEY=test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG
// 5. 배포: supabase functions deploy approve-payment
//
// 또는 Supabase 대시보드에서:
// 1. Edge Functions 메뉴 클릭
// 2. New Function 클릭
// 3. 함수 이름: approve-payment
// 4. 아래 코드 복사/붙여넣기
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOSS_API_URL = "https://api.tosspayments.com/v1/payments";
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") || "";

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId: string;
  orderName: string;
  items: Array<{
    productId: string;
    productName: string;
    productNameKr: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface TossPaymentResponse {
  mId: string;
  version: string;
  paymentKey: string;
  status: string;
  lastTransactionKey: string;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  useEscrow: boolean;
  cultureExpense: boolean;
  orderId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  country: string;
  virtualAccount?: any;
  transfer?: any;
  mobilePhone?: any;
  giftCertificate?: any;
  cashReceipt?: any;
  discount?: any;
  cancels?: any[];
  secret: string;
  type: string;
  easyPay?: any;
  card?: any;
  failure?: {
    code: string;
    message: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 사용자 정보 확인
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 요청 본문 파싱
    const body: PaymentConfirmRequest = await req.json();

    // 필수 파라미터 검증
    if (!body.paymentKey || !body.orderId || !body.amount) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          required: ["paymentKey", "orderId", "amount"],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 시크릿 키 확인
    if (!TOSS_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "TOSS_SECRET_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const confirmUrl = `${TOSS_API_URL}/${body.paymentKey}/confirm`;
    const basicAuth = btoa(`${TOSS_SECRET_KEY}:`);

    const tossResponse = await fetch(confirmUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: body.orderId,
        amount: body.amount,
      }),
    });

    const tossData: TossPaymentResponse = await tossResponse.json();

    if (!tossResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Payment confirmation failed",
          details: tossData.failure || tossData,
        }),
        {
          status: tossResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 결제 승인 성공 - DB에 저장
    const { error: dbError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        order_number: body.orderId,
        amount: body.amount,
        status: "completed",
        items: body.items || [],
      })
      .select()
      .single();

    // DB 저장 실패 시 (중복 등) - 결제는 성공했으므로 성공으로 처리
    if (dbError) {
      // 중복 키 오류는 무시 (이미 저장된 경우)
      if (dbError.code !== "23505") {
        console.error("DB 저장 오류:", dbError);
        // 결제는 성공했으므로 경고만 로깅
      }
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          paymentKey: tossData.paymentKey,
          orderId: tossData.orderId,
          orderName: tossData.orderName,
          totalAmount: tossData.totalAmount,
          status: tossData.status,
          approvedAt: tossData.approvedAt,
        },
        message: "Payment confirmed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

