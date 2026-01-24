import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ChatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    const w = window as typeof window & {
      Chatling?: { open?: () => void };
      chtl?: { open?: () => void };
    };

    if (w.Chatling?.open) {
      w.Chatling.open();
      return;
    }

    if (w.chtl?.open) {
      w.chtl.open();
      return;
    }

    const launcher =
      document.querySelector<HTMLElement>("#chtl-launcher") ??
      document.querySelector<HTMLElement>("[data-chtl-launcher]") ??
      document.querySelector<HTMLElement>(".chtl-launcher") ??
      document.querySelector<HTMLElement>(".chatling-launcher");

    if (launcher) {
      launcher.click();
      return;
    }

    console.warn("Chatling 위젯이 아직 준비되지 않았습니다.");
  };

  return (
    <Button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50
        h-14 w-14 rounded-full
        bg-primary hover:bg-primary/90
        text-primary-foreground
        shadow-lg shadow-primary/50
        transition-all duration-300
        ${isHovered ? "shadow-[0_0_30px_hsl(var(--primary)/0.6)] scale-110" : "scale-100"}
        animate-blood-pulse
      `}
      aria-label="상담하기"
    >
      <MessageCircle
        className={`h-6 w-6 transition-transform duration-300 ${isHovered ? "scale-110" : "scale-100"}`}
      />
    </Button>
  );
};

export default ChatButton;

