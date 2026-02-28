# 챗봇 설정 가이드 (Supabase Edge Function)

챗봇이 제대로 작동하려면 Supabase Edge Function을 배포해야 합니다.

## 🚀 빠른 설정 가이드

### 1단계: Supabase CLI 설치

```bash
npm install -g supabase
```

### 2단계: Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 로그인하세요.

### 3단계: 프로젝트 연결

```bash
# Supabase Dashboard에서 Project Reference ID 확인
# URL: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]

supabase link --project-ref YOUR-PROJECT-REF
```

### 4단계: chat-openai Edge Function 배포

```bash
# Edge Function 배포
supabase functions deploy chat-openai

# OpenAI API 키 설정
supabase secrets set OPENAI_API_KEY=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
```

### 5단계: 배포 확인

```bash
# 배포된 함수 목록 확인
supabase functions list

# 시크릿 키 확인
supabase secrets list
```

## ✅ 설정 완료 확인

1. 웹사이트 접속
2. 채팅 버튼 클릭
3. "안녕하세요" 입력
4. 챗봇이 응답하면 성공! 🎉

## 🐛 문제 해결

### "죄송합니다. 답변을 생성하지 못했습니다." 오류

**원인**: Edge Function이 배포되지 않았거나 OpenAI API 키가 설정되지 않음

**해결 방법**:

1. Edge Function 배포 확인:
```bash
supabase functions list
```

2. OpenAI API 키 확인:
```bash
supabase secrets list
```

3. Edge Function 로그 확인:
```bash
supabase functions logs chat-openai
```

### "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다" 오류

**해결 방법**:
```bash
supabase secrets set OPENAI_API_KEY=your-actual-key-here
```

### Edge Function 재배포

코드를 수정했다면:
```bash
supabase functions deploy chat-openai --no-verify-jwt
```

## 📋 필요한 환경변수

### 로컬 개발 환경 (.env.local)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Edge Function (Supabase Dashboard에서 설정)

- `OPENAI_API_KEY`: OpenAI API 키
- `SUPABASE_URL`: (자동 제공)
- `SUPABASE_SERVICE_ROLE_KEY`: (자동 제공)

## 🔍 Edge Function 테스트

터미널에서 직접 테스트:

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/chat-openai' \
  --header 'Authorization: Bearer YOUR-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"안녕하세요","history":[]}'
```

성공하면 다음과 같은 응답을 받습니다:
```json
{
  "reply": "안녕하세요! 무엇을 도와드릴까요?"
}
```

## 💡 추가 정보

- Edge Function은 Deno 런타임에서 실행됩니다
- 함수 코드 위치: `supabase/functions/chat-openai/index.ts`
- 함수는 자동으로 CORS 설정이 적용됩니다
- OpenAI API 호출은 서버에서 처리되어 API 키가 클라이언트에 노출되지 않습니다

## 📚 관련 문서

- [Supabase Edge Functions 공식 문서](https://supabase.com/docs/guides/functions)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [프로젝트 전체 환경변수 가이드](./ENV_SETUP.md)

