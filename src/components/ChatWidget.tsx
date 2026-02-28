import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";
import type { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { checkAndSetUserEmail, setLastSearchResults, getCurrentUserEmail, getLastSearchResults } from "@/lib/chatGlobals";
import { supabase } from "@/lib/supabase";
import { create_order, get_orders, get_recommendations } from "@/lib/orderService";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: Product[];
};

interface ChatWidgetProps {
  onAddToCart?: (product: Product) => void;
}

const ChatWidget = ({ onAddToCart }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "안녕하세요! 무엇을 도와드릴까요?",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // OpenAI API 키 (환경변수에서 가져오기)
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

  // OpenAI Function 정의
  const OPENAI_FUNCTIONS = [
    {
      name: "search_products",
      description: "상품을 검색합니다. 사용자가 상품을 찾거나 보고 싶을 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "검색어 (예: 글록, 카타나, rpg, 무기)",
          },
        },
        required: [],
      },
    },
    {
      name: "create_order",
      description: "상품을 주문하고 결제를 진행합니다. 사용자가 상품을 주문하고 싶을 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "number",
            description: "상품 ID (번호로 말한 경우 해당 상품의 실제 ID로 변환)",
          },
          quantity: {
            type: "number",
            description: "주문 수량 (기본값: 1)",
          },
          customer_email: {
            type: "string",
            description: "고객 이메일 (선택사항, 대화로 물어볼 수 있음)",
          },
          customer_name: {
            type: "string",
            description: "고객 이름 (선택사항, 대화로 물어볼 수 있음)",
          },
        },
        required: [],
      },
    },
    {
      name: "get_orders",
      description: "주문 내역을 조회합니다. 사용자가 주문 내역, 구매 이력을 보고 싶을 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          customer_email: {
            type: "string",
            description: "고객 이메일 (선택사항, 대화로 물어볼 수 있음)",
          },
        },
        required: [],
      },
    },
    {
      name: "get_recommendations",
      description: "상품을 추천합니다. 사용자가 '추천해줘', '뭐가 좋아?', '인기 상품', '랜덤으로 보여줘', '골라줘' 같은 말을 하거나, 어떤 상품을 선택할지 모를 때 사용합니다. 랜덤으로 3개의 상품을 선택해서 보여주고, 사용자가 번호로 바로 주문할 수 있게 합니다.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "상품 카테고리 (선택사항). 사용자가 특정 종류를 언급하면 해당 카테고리를 사용하세요. 예: '권총 추천' → pistol, '폭발물' → explosive, '칼' → blade, '근접 무기' → melee",
            enum: ["pistol", "explosive", "melee", "blade", "launcher", "crossbow"],
          },
        },
        required: [],
      },
    },
  ];

  const fetchOpenAiReply = async (userText: string, history: ChatMessage[]): Promise<{ text: string; products?: Product[] }> => {
    try {
      // 현재 로그인 이메일 가져오기
      const userEmail = getCurrentUserEmail();
      
      // 현재 검색 결과 가져오기
      const searchResults = getLastSearchResults();
      
      // 동적 시스템 프롬프트 생성
      let systemPrompt = "당신은 친절한 쇼핑몰 고객지원 챗봇입니다. 답변은 간결하고 실용적으로 한국어로 작성하세요.\n\n";

      // === 로그인 상태에 따른 프롬프트 ===
      if (userEmail) {
        // 로그인 상태
        systemPrompt += `**중요**: 사용자 이메일은 이미 확인되었습니다: ${userEmail}\n` +
          "이메일을 다시 묻지 마세요.\n" +
          "customers 테이블에 이 이메일이 없으면 이름만 물어보세요.\n\n";
      } else {
        // 비로그인 상태
        systemPrompt += "**중요**: 주문할 때 이메일을 먼저 물어보세요.\n" +
          "그 이메일로 customers 테이블을 조회해서 고객 정보가 없으면 이름도 물어보세요.\n\n";
      }

      // === 번호 및 수량 인식 규칙 ===
      systemPrompt += "**상품 번호 인식 규칙**:\n";
      
      if (searchResults.length > 0) {
        systemPrompt += "현재 검색된 상품 목록:\n";
        searchResults.forEach((product, index) => {
          systemPrompt += `- ${index + 1}번 (${index === 0 ? '첫 번째' : index === 1 ? '두 번째' : index === 2 ? '세 번째' : `${index + 1}번째`}): ${product.nameKr || product.name} (ID: ${product.id})\n`;
        });
        systemPrompt += "\n";
        systemPrompt += "사용자가 번호로 주문할 때:\n";
        systemPrompt += '- "1번", "첫 번째" → product_id: ' + searchResults[0]?.id + '\n';
        systemPrompt += '- "2번", "두 번째" → product_id: ' + (searchResults[1]?.id || '없음') + '\n';
        systemPrompt += '- "3번", "세 번째" → product_id: ' + (searchResults[2]?.id || '없음') + '\n';
        systemPrompt += "이런 식으로 번호를 상품 ID로 변환해주세요.\n\n";
      } else {
        systemPrompt += "⚠️ 현재 검색된 상품이 없습니다!\n";
        systemPrompt += '사용자가 "1번 주문해주세요" 같은 말을 하면:\n';
        systemPrompt += '"먼저 상품을 검색해주세요. 어떤 상품을 찾으시나요?" 라고 응답하세요.\n\n';
      }

      systemPrompt += "**수량 인식 규칙**:\n";
      systemPrompt += '- "2개" → quantity: 2\n';
      systemPrompt += '- "세 개" → quantity: 3\n';
      systemPrompt += '- "다섯 개" → quantity: 5\n';
      systemPrompt += '- 수량을 말하지 않으면 → quantity: 1 (기본값)\n\n';

      systemPrompt += "**주문 처리 예시**:\n";
      systemPrompt += '사용자: "1번 2개 주문할게요"\n';
      systemPrompt += '→ product_id: (1번 상품의 ID), quantity: 2\n';
      systemPrompt += '→ create_order 함수 호출 준비\n';

      const recentMessages = history
        .filter((message) => message.id !== "welcome")
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: message.text,
        }));

      // 직접 OpenAI API 호출
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          functions: OPENAI_FUNCTIONS,
          function_call: "auto",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...recentMessages,
            {
              role: "user",
              content: userText,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API 오류:", errorData);
        return "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.";
      }

      const data = await response.json();
      
      // Function Calling 처리
      if (data.choices && data.choices[0]?.message?.function_call) {
        const functionCall = data.choices[0].message.function_call;
        const functionName = functionCall.name;
        const functionArgs = JSON.parse(functionCall.arguments || "{}");

        console.log("[Function Call]", functionName, functionArgs);

        // 함수 실행
        if (functionName === "search_products") {
          // search_products는 이미 handleSend에서 처리됨
          const query = functionArgs.query || userText;
          return { text: `"${query}"로 검색 중입니다...` };
          
        } else if (functionName === "create_order") {
          // create_order 함수 실행
          const result = await create_order(
            functionArgs.product_id,
            functionArgs.quantity || 1,
            functionArgs.customer_email,
            functionArgs.customer_name
          );

          return { text: result.message };
          
        } else if (functionName === "get_orders") {
          // get_orders 함수 실행
          const result = await get_orders(
            functionArgs.customer_email
          );

          return { text: result.message };
          
        } else if (functionName === "get_recommendations") {
          // get_recommendations 함수 실행
          const result = await get_recommendations(
            functionArgs.category
          );

          // 추천된 상품을 lastSearchResults에 저장하고 카드로 표시
          if (result.success && result.products) {
            setLastSearchResults(result.products);
            
            // products 타입으로 변환
            const productsForDisplay = result.products.map((p: any) => ({
              id: p.id,
              name: p.name || '',
              nameKr: p.name_kr || p.nameKr || '',
              description: p.description || '',
              price: p.price || 0,
              imageUrl: p.image_url || p.imageUrl || '',
              damage: p.damage || 0,
              fireRate: p.fire_rate || p.fireRate || 0,
              weight: p.weight || 0,
              type: p.type || 'melee',
              lore: p.lore || '',
              stock: p.stock
            })) as Product[];
            
            return { 
              text: "이런 상품 어떠세요?", 
              products: productsForDisplay 
            };
          }

          return { text: result.message };
        }
      }
      
      // 일반 텍스트 응답
      if (data.choices && data.choices[0]?.message?.content) {
        return { text: data.choices[0].message.content };
      }

      return { text: "죄송합니다. 답변을 생성하지 못했습니다." };
    } catch (error) {
      console.error("챗봇 오류:", error);
      return { text: "죄송합니다. 서비스에 문제가 발생했습니다." };
    }
  };

  const searchProducts = (query: string): Product[] => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return [];

    // 특수 케이스: "상품", "무기", "전체" 등으로 전체 목록 요청
    if (
      normalized.includes("전체") || 
      normalized.includes("모두") ||
      normalized.includes("다") ||
      (normalized.includes("상품") && !normalized.includes("찾")) ||
      (normalized.includes("무기") && !normalized.includes("찾"))
    ) {
      return products;
    }

    const keywords = normalized.split(/\s+/).filter(Boolean);
    const results = products.filter((product) => {
      const haystack = `${product.name} ${product.nameKr} ${product.type} ${product.description}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    });

    // 검색 결과가 없으면 전체 목록 반환
    return results.length > 0 ? results : products;
  };

  const isSearchIntent = (text: string) => {
    const normalized = text.toLowerCase();
    
    // 검색 의도 키워드
    const searchKeywords = [
      "검색", "찾아", "찾아줘", "보여", "보여줘", 
      "추천", "추천해", "뭐", "뭐야", "있어",
      "상품", "무기", "아이템", "물건"
    ];
    
    // 상품 관련 키워드
    const productKeywords = [
      "글록", "glock", "shadow",
      "c4", "폭탄", "explosive",
      "전기톱", "chainsaw", "rusty",
      "카타나", "katana", "dark",
      "rpg", "섬멸자", "annihilator",
      "석궁", "crossbow", "death"
    ];
    
    // 검색 키워드가 있거나, 상품 관련 키워드가 있으면 검색 의도로 판단
    return searchKeywords.some(keyword => normalized.includes(keyword)) ||
           productKeywords.some(keyword => normalized.includes(keyword));
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
      const matchedProducts = isSearchIntent(trimmed) ? searchProducts(trimmed) : [];
      
      // 검색 결과가 있으면 전역 변수에 저장
      if (matchedProducts.length > 0) {
        setLastSearchResults(matchedProducts.slice(0, 6));
      }
      
      let assistantMessage: ChatMessage;
      
      if (matchedProducts.length > 0) {
        // 검색 결과가 있을 때
        assistantMessage = {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          text: `검색 결과 ${matchedProducts.length}개를 찾았어요.`,
          products: matchedProducts.slice(0, 6),
        };
      } else {
        // OpenAI API 호출
        const aiReply = trimmed === "테스트"
          ? { text: `상품 목록:\n${products.map((product) => product.nameKr || product.name).join("\n")}` }
          : await fetchOpenAiReply(trimmed, [...messages, userMessage]);
        
        assistantMessage = {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          text: aiReply.text,
          products: aiReply.products,
        };
      }

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

  // 챗봇 시작 시 로그인 정보 확인
  useEffect(() => {
    checkAndSetUserEmail();
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-[90vw] max-w-2xl rounded-lg border border-border bg-card text-card-foreground shadow-lg sm:w-96 md:w-[500px]">
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
          <div ref={listRef} className="max-h-96 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-auto w-full max-w-[95%] whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-muted-foreground"
                }
              >
                {message.text}
                {message.products && message.products.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {message.products.map((product, index) => (
                      <div
                        key={product.id}
                        className="group relative overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all hover:shadow-md"
                      >
                        {/* 번호 배지 */}
                        <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                          {index + 1}
                        </div>

                        {/* 상품 이미지 */}
                        {product.imageUrl ? (
                          <div className="relative h-32 w-full overflow-hidden bg-muted">
                            <img
                              src={product.imageUrl}
                              alt={product.nameKr || product.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex h-32 w-full items-center justify-center bg-muted">
                            <span className="text-sm text-muted-foreground">이미지 없음</span>
                          </div>
                        )}

                        {/* 상품 정보 */}
                        <div className="p-3">
                          {/* 상품 이름 */}
                          <h4 className="mb-2 line-clamp-2 text-sm font-bold text-foreground">
                            {product.nameKr || product.name}
                          </h4>

                          {/* 가격 및 재고 */}
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">가격</span>
                              <span className="text-lg font-bold text-gold">
                                ₩{product.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-muted-foreground">재고</span>
                              <span className="text-sm font-semibold text-green-600">
                                {Math.floor(Math.random() * 50) + 10}개
                              </span>
                            </div>
                          </div>

                          {/* 상품 타입 배지 */}
                          <div className="mb-3">
                            <span className="inline-block rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                              {product.type}
                            </span>
                          </div>

                          {/* 장바구니 버튼 */}
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart(product);
                              }
                              toast({
                                title: "장바구니에 담았습니다",
                                description: `${product.nameKr || product.name} 상품을 담았어요.`,
                              });
                            }}
                          >
                            🛒 장바구니 담기
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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


