import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ChatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // 상담 기능 구현 (예: 채팅 모달 열기, 외부 링크 등)
    console.log("상담 버튼 클릭");
    // 여기에 실제 상담 기능을 추가할 수 있습니다
    // 예: window.open('https://chat-url.com', '_blank');
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
        ${isHovered ? 'shadow-[0_0_30px_hsl(var(--primary)/0.6)] scale-110' : 'scale-100'}
        animate-blood-pulse
      `}
      aria-label="상담하기"
    >
      <MessageCircle 
        className={`h-6 w-6 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`} 
      />
    </Button>
  );
};

export default ChatButton;

