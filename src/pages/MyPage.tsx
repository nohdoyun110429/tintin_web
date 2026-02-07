import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skull, Mail, LogOut, Shield, Edit, Lock, CreditCard, Calendar, DollarSign } from "lucide-react";
import Header from "@/components/Header";

interface PaymentItem {
  productId: string;
  productName: string;
  productNameKr: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface PaymentHistory {
  id: string;
  order_number: string;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  items: PaymentItem[];
}

const MyPage = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItemCount] = useState(0);
  
  // 회원 정보 수정 상태
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // 결제 내역 상태 (나중에 Supabase에서 가져올 수 있음)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (user) {
      setNewEmail(user.email || "");
      loadPaymentHistory();
    }
  }, [user, loading, navigate]);

  const loadPaymentHistory = async () => {
    if (!user) return;
    
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setPaymentHistory(data as PaymentHistory[]);
      }
    } catch (error: any) {
      console.error('결제 내역 로드 실패:', error);
      toast({
        title: "결제 내역 로드 실패",
        description: error.message || "결제 내역을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "변경사항 없음",
        description: "이메일이 변경되지 않았습니다.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: "이메일 오류",
        description: "유효한 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) {
        throw error;
      }

      toast({
        title: "이메일 변경 요청 완료",
        description: "새 이메일 주소로 인증 메일을 보냈습니다. 확인해주세요.",
        className: "bg-card border-primary text-foreground",
      });
    } catch (error: any) {
      toast({
        title: "이메일 변경 실패",
        description: error.message || "이메일 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
        className: "bg-card border-primary text-foreground",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
        className: "bg-card border-primary text-foreground",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "로그아웃 실패",
        description: error.message || "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Skull className="h-12 w-12 text-primary animate-flicker mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background noise-overlay scan-lines">
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => {}} 
      />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-border bg-card/90 backdrop-blur-md">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Skull className="h-16 w-16 text-primary animate-flicker" />
              </div>
              <CardTitle className="font-display text-3xl tracking-widest">
                마이페이지
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                계정 정보를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">회원정보 수정</TabsTrigger>
                  <TabsTrigger value="payments">결제 내역</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-6">
                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      기본 정보
                    </h3>
                    
                    <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background/50">
                      <Shield className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">사용자 ID</p>
                        <p className="font-mono text-sm text-foreground break-all">
                          {user.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">현재 이메일</p>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                    </div>

                    {user.email_confirmed_at && (
                      <div className="flex items-center gap-3 p-4 border border-primary/50 rounded-lg bg-primary/5">
                        <div className="flex-1">
                          <p className="text-sm text-primary font-semibold">
                            ✓ 이메일 인증 완료
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(user.email_confirmed_at).toLocaleDateString('ko-KR')}에 인증됨
                          </p>
                        </div>
                      </div>
                    )}

                    {!user.email_confirmed_at && (
                      <div className="flex items-center gap-3 p-4 border border-yellow-500/50 rounded-lg bg-yellow-500/5">
                        <div className="flex-1">
                          <p className="text-sm text-yellow-500 font-semibold">
                            ⚠ 이메일 인증 필요
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            이메일을 확인하여 계정을 활성화해주세요.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 이메일 변경 */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      이메일 변경
                    </h3>
                    
                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newEmail">새 이메일</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          placeholder="new.email@example.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-background border-border"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isUpdatingEmail || newEmail === user.email}
                        className="w-full"
                      >
                        {isUpdatingEmail ? "변경 중..." : "이메일 변경"}
                      </Button>
                    </form>
                  </div>

                  {/* 비밀번호 변경 */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      비밀번호 변경
                    </h3>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">새 비밀번호</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="최소 6자 이상"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-background border-border"
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background border-border"
                          minLength={6}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                        className="w-full"
                      >
                        {isUpdatingPassword ? "변경 중..." : "비밀번호 변경"}
                      </Button>
                    </form>
                  </div>

                  {/* 로그아웃 */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      결제 내역
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPaymentHistory}
                      disabled={isLoadingPayments}
                    >
                      새로고침
                    </Button>
                  </div>

                  {isLoadingPayments ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">로딩 중...</p>
                    </div>
                  ) : paymentHistory.length === 0 ? (
                    <Card className="border-border bg-background/50">
                      <CardContent className="py-12 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">결제 내역이 없습니다.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {paymentHistory.map((payment) => (
                        <Card key={payment.id} className="border-border bg-background/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  주문번호: {payment.order_number}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(payment.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {payment.amount.toLocaleString()} GOLD
                                </p>
                                <span
                                  className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                                    payment.status === 'completed'
                                      ? 'bg-green-500/20 text-green-500'
                                      : payment.status === 'pending'
                                      ? 'bg-yellow-500/20 text-yellow-500'
                                      : 'bg-red-500/20 text-red-500'
                                  }`}
                                >
                                  {payment.status === 'completed'
                                    ? '완료'
                                    : payment.status === 'pending'
                                    ? '대기'
                                    : '취소'}
                                </span>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-border">
                              <p className="text-sm text-muted-foreground mb-2">구매 항목:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {Array.isArray(payment.items) && payment.items.map((item: PaymentItem, index: number) => (
                                  <li key={index} className="text-sm text-foreground">
                                    {item.productNameKr || item.productName} × {item.quantity} ({item.subtotal.toLocaleString()} GOLD)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyPage;

