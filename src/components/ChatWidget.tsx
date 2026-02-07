import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "안녕하세요! 무엇을 도와드릴까요?",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const fetchOpenAiReply = async (userText: string, history: ChatMessage[]) => {
    if (!OPENAI_API_KEY) {
      return "OpenAI API 키가 설정되지 않았습니다. `VITE_OPENAI_API_KEY`를 설정해 주세요.";
    }

    const recentMessages = history
      .filter((message) => message.id !== "welcome")
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.text,
      }));

    const body = {
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: "당신은 친절한 쇼핑몰 고객지원 챗봇입니다.",
        },
        ...recentMessages,
        { role: "user", content: userText },
      ],
    };

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenAI 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "죄송합니다. 답변을 생성하지 못했습니다."
    );
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantText =
        trimmed === "테스트"
          ? `상품 목록:\n${products
              .map((product) => product.nameKr || product.name)
              .join("\n")}`
          : await fetchOpenAiReply(trimmed, [...messages, userMessage]);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        text: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        text: "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-lg border border-border bg-card text-card-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold">채팅</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label="채팅 닫기"
            >
              닫기
            </Button>
          </div>
          <div ref={listRef} className="max-h-72 space-y-2 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-auto w-fit max-w-[85%] whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-muted-foreground"
                }
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!isLoading) {
                    handleSend();
                  }
                }
              }}
              placeholder="메시지를 입력하세요"
              aria-label="채팅 입력"
              disabled={isLoading}
            />
            <Button onClick={handleSend} aria-label="전송" disabled={isLoading}>
              {isLoading ? "전송 중..." : "전송"}
            </Button>
          </div>
        </div>
      )}
      <Button onClick={() => setIsOpen((prev) => !prev)} aria-label="채팅 열기">
        채팅
      </Button>
    </div>
  );
};

export default ChatWidget;


