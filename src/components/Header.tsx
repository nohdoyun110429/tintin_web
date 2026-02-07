import { ShoppingCart, Skull, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

const Header = ({ cartItemCount, onCartClick }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
        className: "bg-card border-primary text-foreground",
      });
      navigate("/");
      setMobileMenuOpen(false);
    } catch (error: any) {
      toast({
        title: "로그아웃 실패",
        description: error.message || "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Skull className="h-8 w-8 text-primary animate-flicker" />
          <div className="flex flex-col">
            <span className="font-display text-xl tracking-widest text-foreground">
              NO MERCY
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              들어오면 쏜다
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#weapons" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            Weapons
          </a>
          <a href="#featured" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            Featured
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/mypage" className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" />
                    마이페이지
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" className="text-sm font-semibold uppercase tracking-wider">
                    로그인
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/signup" className="text-sm font-semibold uppercase tracking-wider">
                    회원가입
                  </Link>
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs font-bold flex items-center justify-center text-primary-foreground animate-pulse-glow">
                {cartItemCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <nav className="flex flex-col gap-4 mt-8">
                <a 
                  href="#weapons" 
                  className="text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Weapons
                </a>
                <a 
                  href="#featured" 
                  className="text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Featured
                </a>
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <>
                      <Link
                        to="/mypage"
                        className="block text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors mb-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        마이페이지
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                        }}
                        className="block w-full text-left text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors mb-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        로그인
                      </Link>
                      <Link
                        to="/signup"
                        className="block text-lg font-display uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        회원가입
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
