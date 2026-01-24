import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ChatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    console.log("챗봇 상담 시작");

    // Chatling 챗봇 위젯을 강제로 여는 명령입니다.
    if (window.Chatling) {
      window.Chatling.open();
    } else {
      // 스크립트가 로드되지 않았을 경우를 대비한 안내
      console.error("Chatling 스크립트가 아직 로드되지 않았습니다.");
      alert("상담창을 불러오는 중입니다. 잠시 후 다시 시도해주세요!");
    }
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

