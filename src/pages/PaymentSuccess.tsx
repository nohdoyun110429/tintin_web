import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const savePayment = async () => {
      const orderIdParam = params.get("orderId");
      if (!orderIdParam) {
        toast({
          title: "오류",
          description: "주문번호를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (!user) {
        toast({
          title: "로그인 필요",
          description: "결제 내역을 저장하려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // localStorage에서 결제 정보 가져오기
      const paymentDataStr = localStorage.getItem(`payment_${orderIdParam}`);
      if (!paymentDataStr) {
        toast({
          title: "오류",
          description: "결제 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      try {
        const paymentData = JSON.parse(paymentDataStr);
        setOrderId(paymentData.orderId);
        setAmount(paymentData.amount);

        // 이미 저장된 주문인지 확인 (maybeSingle 사용 - 결과가 없어도 오류 발생 안 함)
        const { data: existingOrder, error: checkError } = await supabase
          .from("payments")
          .select("id")
          .eq("order_number", paymentData.orderId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116은 "결과 없음" 오류이므로 정상, 다른 오류만 처리
          throw checkError;
        }

        if (existingOrder) {
          // 이미 저장된 주문이면 스킵
          setIsSaving(false);
          localStorage.removeItem(`payment_${orderIdParam}`);
          toast({
            title: "결제 내역 확인 완료",
            description: "이미 저장된 결제 내역입니다.",
            className: "bg-card border-primary text-foreground",
          });
          return;
        }

        // DB에 결제 내역 저장
        const { error: insertError } = await supabase.from("payments").insert({
          user_id: user.id,
          order_number: paymentData.orderId,
          amount: paymentData.amount,
          status: "completed",
          items: paymentData.items,
        });

        if (insertError) {
          // 409 오류는 중복 키 오류 (이미 존재하는 주문)
          if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
            // 이미 저장된 주문으로 처리
            setIsSaving(false);
            localStorage.removeItem(`payment_${orderIdParam}`);
            toast({
              title: "결제 내역 확인 완료",
              description: "이미 저장된 결제 내역입니다.",
              className: "bg-card border-primary text-foreground",
            });
            return;
          }
          throw insertError;
        }

        // localStorage에서 결제 정보 삭제
        localStorage.removeItem(`payment_${orderIdParam}`);

        toast({
          title: "결제 내역 저장 완료",
          description: "결제 내역이 저장되었습니다.",
          className: "bg-card border-primary text-foreground",
        });
      } catch (error: any) {
        console.error("결제 내역 저장 실패:", error);
        const errorMessage = error?.message || error?.details || error?.hint || "결제 내역 저장 중 오류가 발생했습니다.";
        toast({
          title: "결제 내역 저장 실패",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    savePayment();
  }, [params, user, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center space-y-4">
        {isSaving ? (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h1 className="font-display text-2xl tracking-widest text-primary">
              결제 처리 중...
            </h1>
            <p className="text-sm text-muted-foreground">
              결제 내역을 저장하고 있습니다.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="font-display text-2xl tracking-widest text-primary">
              결제 완료
            </h1>
            <p className="text-sm text-muted-foreground">
              결제가 정상적으로 완료되었습니다.
            </p>
            {orderId && (
              <p className="text-xs text-muted-foreground">주문번호: {orderId}</p>
            )}
            {amount && (
              <p className="text-xs text-muted-foreground">
                결제금액: {amount.toLocaleString()} GOLD
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                홈으로
              </Button>
              <Button onClick={() => navigate("/mypage")} className="flex-1">
                결제 내역 보기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;


