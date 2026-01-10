import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skull, Mail, Lock, User } from "lucide-react";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "이메일 오류",
        description: "유효한 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("회원가입 시도:", { email });
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      console.log("Supabase 응답:", { data, error });

      if (error) {
        console.error("회원가입 에러:", error);
        let errorMessage = "회원가입 중 오류가 발생했습니다.";
        
        // 에러 메시지 한글화
        if (error.message.includes("already registered")) {
          errorMessage = "이미 등록된 이메일입니다.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "유효하지 않은 이메일 주소입니다.";
        } else if (error.message.includes("Password")) {
          errorMessage = "비밀번호가 너무 짧거나 약합니다.";
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        toast({
          title: "회원가입 실패",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // 이메일 확인이 필요한 경우와 필요 없는 경우 모두 처리
      if (data.user) {
        if (data.session) {
          // 이메일 확인이 필요 없는 경우 (즉시 로그인)
          toast({
            title: "회원가입 성공",
            description: "환영합니다! 계정이 생성되었습니다.",
            className: "bg-card border-primary text-foreground",
          });
          navigate("/");
        } else {
          // 이메일 확인이 필요한 경우
          toast({
            title: "회원가입 성공",
            description: "이메일을 확인하여 계정을 활성화해주세요.",
            className: "bg-card border-primary text-foreground",
          });
          navigate("/login");
        }
      } else {
        throw new Error("사용자 데이터를 받지 못했습니다.");
      }
    } catch (error: any) {
      console.error("예상치 못한 에러:", error);
      toast({
        title: "회원가입 실패",
        description: error?.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background noise-overlay scan-lines p-4">
      <Card className="w-full max-w-md border-border bg-card/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Skull className="h-12 w-12 text-primary animate-flicker" />
          </div>
          <CardTitle className="font-display text-3xl tracking-widest">
            회원가입
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            새로운 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "처리 중..." : "회원가입"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-semibold"
            >
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;


