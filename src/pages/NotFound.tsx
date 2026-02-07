import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Skull, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-blood via-blood-dark to-background" />
      <div className="relative z-10 text-center px-4">
        <Skull className="h-20 w-20 text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="font-display text-8xl text-foreground tracking-widest mb-4 text-blood-glow">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          TARGET NOT FOUND
        </p>
        <p className="text-sm text-primary/60 tracking-widest mb-8">
          대상을 찾을 수 없음
        </p>
        <Button variant="outline" asChild>
          <a href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            RETURN TO BASE
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
