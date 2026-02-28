import { supabase } from "./supabase";
import type { Product } from "@/types/product";

/**
 * 챗봇 전역 변수
 * 다른 컴포넌트에서도 접근 가능하도록 export
 */

// 현재 사용자 이메일 전역 변수
export let currentUserEmail: string | null = null;

// 마지막 검색 결과 전역 변수
export let lastSearchResults: Product[] = [];

/**
 * 현재 사용자 이메일 설정
 * @param email - 사용자 이메일 또는 null
 */
export const setCurrentUserEmail = (email: string | null) => {
  currentUserEmail = email;
};

/**
 * 현재 사용자 이메일 가져오기
 * @returns 현재 사용자 이메일 또는 null
 */
export const getCurrentUserEmail = (): string | null => {
  return currentUserEmail;
};

/**
 * 마지막 검색 결과 설정
 * @param results - 검색된 상품 배열
 */
export const setLastSearchResults = (results: Product[]) => {
  lastSearchResults = results;
  console.log(`[챗봇] 검색 결과 ${results.length}개 저장됨`);
};

/**
 * 마지막 검색 결과 가져오기
 * @returns 마지막 검색된 상품 배열
 */
export const getLastSearchResults = (): Product[] => {
  return lastSearchResults;
};

/**
 * 번호로 상품 가져오기 (1번 = 첫 번째 상품)
 * @param number - 상품 번호 (1부터 시작)
 * @returns 해당 번호의 상품 또는 undefined
 */
export const getProductByNumber = (number: number): Product | undefined => {
  if (number < 1 || number > lastSearchResults.length) {
    console.warn(`[챗봇] 유효하지 않은 상품 번호: ${number} (총 ${lastSearchResults.length}개)`);
    return undefined;
  }
  return lastSearchResults[number - 1];
};

/**
 * 로그인 정보 확인 및 이메일 설정
 * 여러 저장소를 순서대로 확인하여 사용자 이메일을 찾습니다.
 * 
 * 확인 순서:
 * 1. localStorage에서 user 또는 userInfo 찾기
 * 2. sessionStorage에서 user 또는 userInfo 찾기
 * 3. Supabase Auth 세션에서 user.email 찾기
 * 
 * @returns 찾은 이메일 또는 null
 */
export const checkAndSetUserEmail = async (): Promise<string | null> => {
  try {
    // 1. localStorage에서 확인
    const localUser = localStorage.getItem("user");
    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        if (userData?.email) {
          setCurrentUserEmail(userData.email);
          console.log("[챗봇] localStorage에서 이메일 확인:", userData.email);
          return userData.email;
        }
      } catch (e) {
        console.warn("[챗봇] localStorage user 파싱 실패:", e);
      }
    }

    const localUserInfo = localStorage.getItem("userInfo");
    if (localUserInfo) {
      try {
        const userInfoData = JSON.parse(localUserInfo);
        if (userInfoData?.email) {
          setCurrentUserEmail(userInfoData.email);
          console.log("[챗봇] localStorage userInfo에서 이메일 확인:", userInfoData.email);
          return userInfoData.email;
        }
      } catch (e) {
        console.warn("[챗봇] localStorage userInfo 파싱 실패:", e);
      }
    }

    // 2. sessionStorage에서 확인
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
      try {
        const userData = JSON.parse(sessionUser);
        if (userData?.email) {
          setCurrentUserEmail(userData.email);
          console.log("[챗봇] sessionStorage에서 이메일 확인:", userData.email);
          return userData.email;
        }
      } catch (e) {
        console.warn("[챗봇] sessionStorage user 파싱 실패:", e);
      }
    }

    const sessionUserInfo = sessionStorage.getItem("userInfo");
    if (sessionUserInfo) {
      try {
        const userInfoData = JSON.parse(sessionUserInfo);
        if (userInfoData?.email) {
          setCurrentUserEmail(userInfoData.email);
          console.log("[챗봇] sessionStorage userInfo에서 이메일 확인:", userInfoData.email);
          return userInfoData.email;
        }
      } catch (e) {
        console.warn("[챗봇] sessionStorage userInfo 파싱 실패:", e);
      }
    }

    // 3. Supabase Auth 세션에서 확인
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn("[챗봇] Supabase 세션 확인 중 오류:", error.message);
    } else if (session?.user?.email) {
      setCurrentUserEmail(session.user.email);
      console.log("[챗봇] Supabase Auth에서 이메일 확인:", session.user.email);
      return session.user.email;
    }

    // 모든 곳에서 찾지 못함
    console.log("[챗봇] 로그인 정보를 찾을 수 없습니다.");
    setCurrentUserEmail(null);
    return null;

  } catch (error) {
    console.error("[챗봇] 로그인 정보 확인 중 오류:", error);
    setCurrentUserEmail(null);
    return null;
  }
};

