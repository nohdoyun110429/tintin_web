import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentFail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center space-y-4">
        <h1 className="font-display text-2xl tracking-widest text-destructive">결제 실패</h1>
        <p className="text-sm text-muted-foreground">
          결제에 실패했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        {code && (
          <p className="text-xs text-muted-foreground">오류 코드: {code}</p>
        )}
        {message && (
          <p className="text-xs text-muted-foreground">메시지: {message}</p>
        )}
        <Button variant="outline" onClick={() => navigate("/")}>
          홈으로
        </Button>
      </div>
    </div>
  );
};

export default PaymentFail;



