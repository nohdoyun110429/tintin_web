# 환경변수 설정 가이드

이 문서는 웹사이트를 실행하기 위해 필요한 환경변수 설정 방법을 설명합니다.

## 📋 목차

1. [필수 환경변수](#필수-환경변수)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [Supabase 설정](#supabase-설정)
4. [토스페이먼츠 설정](#토스페이먼츠-설정)
5. [OpenAI API 설정](#openai-api-설정)
6. [Vercel 배포 시 설정](#vercel-배포-시-설정)

---

## 필수 환경변수

이 프로젝트에서 사용하는 환경변수는 다음과 같습니다:

### 클라이언트 환경변수 (Vite)

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon (Public) Key | ✅ 필수 |

### Edge Functions 환경변수 (Supabase Dashboard에서 설정)

| 변수명 | 설명 | 사용 함수 |
|--------|------|-----------|
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 | approve-payment |
| `OPENAI_API_KEY` | OpenAI API 키 | chat-openai |
| `SUPABASE_URL` | Supabase URL (자동 제공) | 모든 함수 |
| `SUPABASE_ANON_KEY` | Supabase Anon Key (자동 제공) | 모든 함수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (자동 제공) | chat-openai |

---

## 로컬 개발 환경 설정

### 1단계: 환경변수 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다:

```bash
# Windows (PowerShell)
Copy-Item env.template .env.local

# macOS/Linux
cp env.template .env.local
```

### 2단계: 환경변수 값 입력

`.env.local` 파일을 열어서 실제 값을 입력합니다:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3단계: 개발 서버 실행

```bash
npm install
npm run dev
```

---

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 로그인
2. "New Project" 버튼 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전 선택
4. 프로젝트 생성 완료 대기 (약 2-3분 소요)

### 2. API 키 확인

1. Supabase Dashboard에서 프로젝트 선택
2. 왼쪽 메뉴에서 **Settings** > **API** 클릭
3. 다음 값을 복사:
   - **Project URL**: `VITE_SUPABASE_URL`에 사용
   - **anon public**: `VITE_SUPABASE_ANON_KEY`에 사용

### 3. 데이터베이스 설정

프로젝트의 SQL 파일들을 실행하여 테이블을 생성합니다:

1. Supabase Dashboard > **SQL Editor** 클릭
2. 다음 파일들을 순서대로 실행:
   ```
   supabase_schema.sql          (또는 supabase_setup.sql)
   supabase_products_seed.sql   (상품 데이터 추가)
   ```

### 4. Edge Functions 배포

#### Supabase CLI 설치

```bash
npm install -g supabase
```

#### 로그인 및 프로젝트 연결

```bash
# Supabase 로그인
supabase login

# 프로젝트 연결 (project-ref는 Supabase Dashboard URL에서 확인)
supabase link --project-ref your-project-ref
```

#### approve-payment 함수 배포

```bash
# 함수 배포
supabase functions deploy approve-payment

# 시크릿 키 설정 (테스트용)
supabase secrets set TOSS_SECRET_KEY=test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG

# 실제 운영 환경에서는 실제 시크릿 키 사용
# supabase secrets set TOSS_SECRET_KEY=live_sk_YOUR_ACTUAL_SECRET_KEY
```

#### chat-openai 함수 배포

```bash
# 함수 배포
supabase functions deploy chat-openai

# OpenAI API 키 설정
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key
```

---

## 토스페이먼츠 설정

### 1. 개발자 등록

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 접속
2. 회원가입 및 로그인
3. "내 앱 만들기" 또는 "시작하기" 클릭

### 2. API 키 발급

#### 테스트 환경

테스트 키는 이미 코드에 포함되어 있습니다:
- **클라이언트 키**: `test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm`
- **시크릿 키**: `test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG`

#### 실제 운영 환경

1. 토스페이먼츠 Dashboard에서 "라이브 API 키" 발급
2. 클라이언트 키 업데이트:
   - `src/lib/tosspayments.ts` 파일의 `CLIENT_KEY` 값 변경
3. 시크릿 키 업데이트:
   ```bash
   supabase secrets set TOSS_SECRET_KEY=live_sk_YOUR_ACTUAL_SECRET_KEY
   ```

### 3. 테스트 카드 정보

테스트 환경에서 사용할 수 있는 카드 정보:
- **카드번호**: 아무 16자리 숫자 (예: 1234 5678 1234 5678)
- **유효기간**: 미래의 아무 날짜
- **CVC**: 아무 3자리 숫자

---

## OpenAI API 설정

### 1. API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 로그인 후 **API keys** 메뉴 클릭
3. "Create new secret key" 버튼 클릭
4. 키 이름 입력 후 생성
5. 생성된 키를 안전한 곳에 복사 (재확인 불가)

### 2. Edge Function에 키 설정

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. 요금제 확인

- OpenAI API는 사용량에 따라 요금이 부과됩니다
- [요금 정책](https://openai.com/pricing) 확인 권장
- 초기 테스트 시에는 무료 크레딧 제공

---

## Vercel 배포 시 설정

### 1. Vercel에 환경변수 추가

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 클릭
4. 다음 변수들을 추가:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your_actual_anon_key` | Production, Preview, Development |

### 2. 재배포

환경변수 추가 후 자동으로 재배포되지 않는 경우:
1. **Deployments** 탭 클릭
2. 최신 배포 오른쪽의 "..." 메뉴 클릭
3. "Redeploy" 선택

---

## 🔒 보안 주의사항

### ⚠️ 중요!

1. **절대 Git에 커밋하지 마세요**:
   - `.env`
   - `.env.local`
   - `.env.production`
   - 실제 API 키가 포함된 모든 파일

2. **Public vs Secret 키 구분**:
   - `VITE_` 접두사가 붙은 변수는 클라이언트에 노출됩니다
   - Supabase Anon Key는 공개되어도 안전하도록 설계되었습니다
   - 시크릿 키는 절대 클라이언트 코드에 포함하지 마세요

3. **`.gitignore` 확인**:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

---

## 🔧 문제 해결

### Supabase 연결 오류

```
Error: Supabase 환경변수가 설정되지 않았습니다.
```

**해결 방법**:
1. `.env.local` 파일이 존재하는지 확인
2. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 올바르게 설정되었는지 확인
3. 개발 서버를 재시작: `npm run dev`

### 토스페이먼츠 결제 오류

```
Error: Payment confirmation failed
```

**해결 방법**:
1. Edge Function이 배포되었는지 확인: `supabase functions list`
2. `TOSS_SECRET_KEY`가 설정되었는지 확인: `supabase secrets list`
3. 테스트 키를 사용하는 경우 올바른 키인지 확인

### OpenAI API 오류

```
Error: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.
```

**해결 방법**:
1. OpenAI API 키가 유효한지 확인
2. Edge Function에 키가 설정되었는지 확인: `supabase secrets list`
3. 요금 한도 또는 크레딧 잔액 확인

---

## 📚 추가 문서

- [README.md](./README.md) - 프로젝트 개요
- [README_DB_SETUP.md](./README_DB_SETUP.md) - 데이터베이스 설정 상세
- [supabase_edge_function_setup.md](./supabase_edge_function_setup.md) - Edge Function 설정 상세
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 배포 가이드

---

## 💡 도움이 필요하신가요?

문제가 해결되지 않는다면:
1. 프로젝트의 다른 README 문서들을 참고하세요
2. Supabase 공식 문서: https://supabase.com/docs
3. 토스페이먼츠 공식 문서: https://docs.tosspayments.com/
4. OpenAI 공식 문서: https://platform.openai.com/docs

