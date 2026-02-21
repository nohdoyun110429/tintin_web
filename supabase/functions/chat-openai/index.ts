import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type IncomingMessage = {
  role: "user" | "assistant";
  text: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_CATALOG = [
  { id: "1", name: "Shadow Glock", nameKr: "그림자 글록", price: 2500, type: "pistol", description: "Quiet but deadly. +50 Stealth." },
  { id: "2", name: "C4 Plastic Explosive", nameKr: "C4 폭탄", price: 4500, type: "explosive", description: "Clears the room in 1 second. Area Damage 100%." },
  { id: "3", name: "Rusty Chainsaw", nameKr: "녹슨 전기톱", price: 3200, type: "melee", description: "For close-range terror. Causes 'Bleeding' effect." },
  { id: "4", name: "Dark Katana", nameKr: "암흑 카타나", price: 5800, type: "blade", description: "Slices through armor. Ignore Defense 30%." },
  { id: "5", name: "The Annihilator (RPG-7)", nameKr: "섬멸자 (RPG-7)", price: 12000, type: "launcher", description: "One shot, mass casualty. Cooldown: 60s." },
  { id: "6", name: "Death Crossbow", nameKr: "죽음의 석궁", price: 6500, type: "crossbow", description: "Silent and precise. +75 Accuracy." },
];

const TOOL_DEFS = [
  {
    type: "function",
    name: "get_product_list",
    description: "현재 판매 중인 전체 상품 목록을 조회합니다.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "최대 반환 개수(기본 6개)" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "find_product",
    description: "상품명(한글/영문)이나 타입으로 상품을 검색합니다.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "검색어 (예: 카타나, rpg, pistol)" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "search_products",
    description:
      "사용자 질의를 기준으로 Supabase products 테이블에서 상품을 검색합니다. 상품명 검색이 필요하면 이 도구를 우선 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "검색어 (예: 카타나, 글록, rpg)" },
        limit: { type: "number", description: "최대 반환 개수(기본 10개)" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "recommend_by_budget",
    description: "예산 이하 상품을 가격순으로 추천합니다.",
    parameters: {
      type: "object",
      properties: {
        max_price: { type: "number", description: "최대 예산" },
      },
      required: ["max_price"],
      additionalProperties: false,
    },
  },
];

const executeTool = async (toolName: string, args: Record<string, unknown>) => {
  switch (toolName) {
    case "get_product_list": {
      const limit = typeof args.limit === "number" ? Math.max(1, Math.min(20, args.limit)) : 6;
      return { products: PRODUCT_CATALOG.slice(0, limit) };
    }
    case "find_product": {
      const query = String(args.query || "").toLowerCase().trim();
      const products = PRODUCT_CATALOG.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nameKr.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query)
      );
      return { products };
    }
    case "recommend_by_budget": {
      const max = Number(args.max_price || 0);
      const products = PRODUCT_CATALOG.filter((p) => p.price <= max).sort((a, b) => a.price - b.price);
      return { products };
    }
    case "search_products": {
      const query = String(args.query || "").trim();
      const limit = typeof args.limit === "number" ? Math.max(1, Math.min(50, args.limit)) : 10;
      if (!query) return { products: [] };

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        return { error: "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." };
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const q = `%${query}%`;

      // 테이블 컬럼 스키마 차이를 감안해 최소 컬럼만 안전 조회
      const { data, error } = await supabase
        .from("products")
        .select("id,name,name_kr,price,type,description,image_url")
        .or(`name.ilike.${q},name_kr.ilike.${q}`)
        .limit(limit);

      if (error) {
        return { error: error.message, products: [] };
      }

      return { products: data || [] };
    }
    default:
      return { error: `지원하지 않는 도구: ${toolName}` };
  }
};

const extractReplyText = (data: any): string =>
  data?.output_text ||
  data?.output?.find((item: any) => item?.type === "message")?.content?.[0]?.text ||
  data?.output?.[0]?.content?.[0]?.text ||
  "죄송합니다. 답변을 생성하지 못했습니다.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, history } = (await req.json()) as {
      message?: string;
      history?: IncomingMessage[];
    };

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "message는 필수입니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeHistory = (history || []).slice(-10).filter((m) => m?.text?.trim());
    const normalizedMessage = message.trim().toLowerCase();

    // 사용자가 "상품 하나 보여줘" 의도로 질문하면 반드시 1개 상품을 반환
    const asksSingleProduct =
      normalizedMessage.includes("상품") &&
      (normalizedMessage.includes("하나") || normalizedMessage.includes("1개")) &&
      (normalizedMessage.includes("보여") || normalizedMessage.includes("추천"));

    if (asksSingleProduct) {
      const product = PRODUCT_CATALOG[0];
      const reply =
        `상품 1개를 추천드릴게요.\n` +
        `- 이름: ${product.nameKr} (${product.name})\n` +
        `- 가격: ₩${product.price.toLocaleString()}\n` +
        `- 타입: ${product.type}\n` +
        `- 설명: ${product.description}`;

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        tools: TOOL_DEFS,
        input: [
          {
            role: "system",
            content:
              "당신은 친절한 쇼핑몰 고객지원 챗봇입니다. 답변은 간결하고 실용적으로 한국어로 작성하세요. " +
              "상품명 기반 검색이나 카탈로그 조회가 필요하면 tools(function calling)를 적극 사용하세요. " +
              "특히 사용자가 상품 이름으로 찾을 때는 search_products를 우선 사용하세요.",
          },
          ...safeHistory.map((m) => ({ role: m.role, content: m.text })),
          { role: "user", content: message.trim() },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({ error: "OpenAI 호출 실패", details: errorBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data = await response.json();

    // Function Calling 루프 (최대 3회)
    for (let i = 0; i < 3; i += 1) {
      const functionCalls = (data?.output || []).filter((item: any) => item?.type === "function_call");
      if (!functionCalls.length) break;

      const toolOutputs = await Promise.all(functionCalls.map(async (call: any) => {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = call?.arguments ? JSON.parse(call.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        const result = await executeTool(call.name, parsedArgs);
        return {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        };
      }));

      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          tools: TOOL_DEFS,
          previous_response_id: data.id,
          input: toolOutputs,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return new Response(
          JSON.stringify({ error: "OpenAI 함수호출 후속 요청 실패", details: errorBody }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      data = await response.json();
    }

    const reply = extractReplyText(data);

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

