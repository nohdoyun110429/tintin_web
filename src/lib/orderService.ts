import { supabase } from './supabase';
import { Order, OrderItem } from '@/types/order';
import { getCurrentUserEmail } from './chatGlobals';
import { requestPayment, generateOrderId } from './tosspayments';

// Supabase DB 타입 정의
interface OrderRow {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_price: number;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Customer 타입 정의
interface Customer {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// OrderRow를 Order로 변환
const rowToOrder = (row: OrderRow): Order => ({
  id: row.id,
  userId: row.user_id,
  items: row.items,
  totalPrice: row.total_price,
  createdAt: row.created_at,
  status: row.status,
});

// Order를 OrderRow로 변환
const orderToRow = (order: Order): Omit<OrderRow, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: order.userId,
  items: order.items,
  total_price: order.totalPrice,
  status: order.status,
});

// 사용자의 주문 내역 가져오기
export const getOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('주문 내역 조회 실패:', error);
      throw error;
    }

    return (data || []).map(rowToOrder);
  } catch (error) {
    console.error('주문 내역 조회 오류:', error);
    return [];
  }
};

// 주문 생성 및 저장
export const createOrder = async (
  userId: string,
  items: OrderItem[],
  status: Order['status'] = 'completed'
): Promise<Order | null> => {
  try {
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderData: Omit<OrderRow, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      items,
      total_price: totalPrice,
      status,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('주문 생성 실패:', error);
      throw error;
    }

    return rowToOrder(data);
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return null;
  }
};

// 주문 상태 업데이트
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status']
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('주문 상태 업데이트 실패:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('주문 상태 업데이트 오류:', error);
    return false;
  }
};

/**
 * AI 챗봇에서 호출할 주문 생성 함수
 * 
 * @param product_id - 상품 ID (AI가 "1번"을 숫자로 변환)
 * @param quantity - 수량 (AI가 "2개"를 숫자로 변환)
 * @param customer_email - 고객 이메일 (AI가 물어봐서 받음, 선택사항)
 * @param customer_name - 고객 이름 (AI가 물어봐서 받음, 선택사항)
 * @returns 성공 시 주문 정보, 실패 시 에러 메시지
 */
export const create_order = async (
  product_id: number,
  quantity: number,
  customer_email?: string,
  customer_name?: string
): Promise<{ success: boolean; message: string; order?: any; error?: string }> => {
  try {
    console.log('[create_order] 함수 호출:', { product_id, quantity, customer_email, customer_name });

    // 1. 이메일 결정: customer_email이 있으면 그거 사용, 없으면 currentUserEmail 사용
    let finalEmail = customer_email || getCurrentUserEmail();

    // 2. 이메일이 둘 다 없으면 에러 반환
    if (!finalEmail) {
      console.log('[create_order] 이메일 없음');
      return {
        success: false,
        message: "이메일을 알려주세요",
        error: "EMAIL_REQUIRED"
      };
    }

    console.log('[create_order] 사용할 이메일:', finalEmail);

    // 3. customers 테이블에서 이메일로 조회
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', finalEmail)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (정상적인 경우)
      console.error('[create_order] customers 조회 오류:', customerError);
    }

    console.log('[create_order] customers 조회 결과:', customerData);

    // 4. 이름 결정: customers에서 찾은 이름 사용, 없으면 customer_name 사용
    let finalName = customerData?.name || customer_name;

    // 5. 이름도 없으면 에러 반환
    if (!finalName) {
      console.log('[create_order] 이름 없음');
      return {
        success: false,
        message: "이름을 알려주세요",
        error: "NAME_REQUIRED"
      };
    }

    console.log('[create_order] 사용할 이름:', finalName);

    // 6. product_id로 products 테이블 조회
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id.toString())
      .single();

    // 7. 상품 없으면 에러
    if (productError || !productData) {
      console.log('[create_order] 상품 없음:', productError);
      return {
        success: false,
        message: "상품을 찾을 수 없어요",
        error: "PRODUCT_NOT_FOUND"
      };
    }

    console.log('[create_order] 상품 조회 결과:', productData);

    // 8. 재고 확인
    const currentStock = productData.stock || 100; // stock이 없으면 기본값 100
    if (currentStock < quantity) {
      console.log('[create_order] 재고 부족:', { currentStock, quantity });
      return {
        success: false,
        message: `재고가 부족해요 (현재 재고: ${currentStock}개)`,
        error: "INSUFFICIENT_STOCK"
      };
    }

    // 9. 총 금액 계산
    const totalPrice = productData.price * quantity;
    console.log('[create_order] 총 금액:', totalPrice);

    // 주문 정보 객체 만들기
    const orderInfo = {
      customer_name: finalName,
      customer_email: finalEmail,
      product_id: productData.id,
      product_name: productData.name || productData.name_kr,
      quantity: quantity,
      total_price: totalPrice,
      status: 'pending' as const
    };

    console.log('[create_order] 주문 정보 생성 완료:', orderInfo);

    // === 결제 연결 시작 ===
    
    // 주문 ID 생성
    const orderId = generateOrderId();
    const orderName = `${orderInfo.product_name} ${quantity}개`;
    
    console.log('[create_order] 결제 시작:', { orderId, orderName, amount: totalPrice });

    // localStorage에 결제 정보 임시 저장 (결제 성공 시 사용)
    const paymentData = {
      orderId: orderId,
      amount: totalPrice,
      orderName: orderName,
      customerName: finalName,
      customerEmail: finalEmail,
      items: [{
        productId: productData.id,
        productName: orderInfo.product_name,
        price: productData.price,
        quantity: quantity,
        subtotal: totalPrice
      }],
      productId: productData.id,
      quantity: quantity
    };
    
    localStorage.setItem(`payment_${orderId}`, JSON.stringify(paymentData));
    
    // 토스페이먼츠 결제 요청
    try {
      await requestPayment(
        totalPrice,
        orderId,
        orderName,
        finalName
      );
      
      // requestPayment는 결제창으로 리다이렉트되므로 여기는 실행되지 않음
      // 결제 성공 시 PaymentSuccess 페이지에서 처리됨
      
      return {
        success: true,
        message: "결제 페이지로 이동합니다...",
        order: orderInfo
      };
      
    } catch (paymentError: any) {
      console.error('[create_order] 결제 실패:', paymentError);
      
      // localStorage에서 결제 정보 삭제
      localStorage.removeItem(`payment_${orderId}`);
      
      return {
        success: false,
        message: "결제가 취소되었습니다",
        error: "PAYMENT_CANCELLED"
      };
    }

  } catch (error) {
    console.error('[create_order] 예상치 못한 오류:', error);
    return {
      success: false,
      message: "주문 처리 중 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * 결제 성공 후 주문 완료 처리 함수
 * PaymentSuccess 페이지에서 호출됨
 * 
 * @param orderId - 주문 ID
 * @param userId - 사용자 ID
 */
export const completeOrder = async (
  orderId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // localStorage에서 결제 정보 가져오기
    const paymentDataStr = localStorage.getItem(`payment_${orderId}`);
    if (!paymentDataStr) {
      return {
        success: false,
        message: "결제 정보를 찾을 수 없습니다"
      };
    }

    const paymentData = JSON.parse(paymentDataStr);
    
    // orders 테이블에 주문 정보 저장
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items: paymentData.items,
        total_price: paymentData.amount,
        status: 'completed'
      });

    if (orderError) {
      console.error('[completeOrder] 주문 저장 실패:', orderError);
      throw orderError;
    }

    // products 테이블에서 재고 감소
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', paymentData.productId)
      .single();

    if (!fetchError && currentProduct) {
      const newStock = (currentProduct.stock || 100) - paymentData.quantity;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', paymentData.productId);

      if (updateError) {
        console.error('[completeOrder] 재고 업데이트 실패:', updateError);
      } else {
        console.log('[completeOrder] 재고 감소 완료:', { productId: paymentData.productId, newStock });
      }
    }

    // localStorage에서 결제 정보 삭제
    localStorage.removeItem(`payment_${orderId}`);

    return {
      success: true,
      message: `${paymentData.items[0].productName} ${paymentData.quantity}개 주문 완료!`
    };

  } catch (error) {
    console.error('[completeOrder] 오류:', error);
    return {
      success: false,
      message: "주문 완료 처리 중 오류가 발생했습니다"
    };
  }
};

/**
 * AI 챗봇에서 호출할 주문 내역 조회 함수
 * 
 * @param customer_email - 고객 이메일 (선택사항)
 * @returns 주문 내역 리스트 또는 에러 메시지
 */
export const get_orders = async (
  customer_email?: string
): Promise<{ success: boolean; message: string; orders?: any[] }> => {
  try {
    console.log('[get_orders] 함수 호출:', { customer_email });

    // 1. 이메일 결정: customer_email이 있으면 사용, 없으면 currentUserEmail 사용
    const finalEmail = customer_email || getCurrentUserEmail();

    // 2. 이메일 없으면 에러
    if (!finalEmail) {
      console.log('[get_orders] 이메일 없음');
      return {
        success: false,
        message: "이메일을 알려주세요",
      };
    }

    console.log('[get_orders] 사용할 이메일:', finalEmail);

    // 3. orders 테이블에서 이메일로 조회 (customers 테이블과 조인)
    // 먼저 customers 테이블에서 user_id 찾기
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', finalEmail)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('[get_orders] customers 조회 오류:', customerError);
    }

    let ordersData: any[] = [];

    if (customerData) {
      // customers 테이블에 있는 경우 user_id로 조회
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerData.id)
        .order('created_at', { ascending: false }); // 4. 최신 주문 먼저

      if (ordersError) {
        console.error('[get_orders] orders 조회 오류:', ordersError);
      } else {
        ordersData = data || [];
      }
    } else {
      // customers 테이블에 없으면 payments 테이블에서도 확인
      const { data, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', finalEmail)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('[get_orders] payments 조회 오류:', paymentsError);
      } else {
        ordersData = data || [];
      }
    }

    console.log('[get_orders] 조회 결과:', ordersData.length, '개');

    // 5. 주문 없으면
    if (ordersData.length === 0) {
      return {
        success: true,
        message: "주문 내역이 없어요",
        orders: []
      };
    }

    // 6. 주문 있으면 리스트 형태로 표시
    let resultMessage = `📦 주문 내역 (총 ${ordersData.length}건)\n\n`;

    ordersData.forEach((order, index) => {
      const orderDate = new Date(order.created_at).toLocaleDateString('ko-KR');
      const items = order.items || [];
      const status = order.status === 'completed' ? '✅ 완료' : 
                     order.status === 'pending' ? '⏳ 대기 중' : 
                     '❌ 취소됨';

      resultMessage += `${index + 1}. ${orderDate}\n`;
      resultMessage += `   상태: ${status}\n`;
      
      if (items.length > 0) {
        items.forEach((item: any) => {
          resultMessage += `   - ${item.productName || item.product_name} x${item.quantity}개\n`;
        });
      }
      
      resultMessage += `   금액: ₩${(order.total_price || order.amount || 0).toLocaleString()}\n\n`;
    });

    return {
      success: true,
      message: resultMessage,
      orders: ordersData
    };

  } catch (error) {
    console.error('[get_orders] 예상치 못한 오류:', error);
    return {
      success: false,
      message: "주문 내역 조회 중 오류가 발생했습니다",
    };
  }
};

/**
 * AI 챗봇에서 호출할 상품 추천 함수
 * products 테이블에서 랜덤으로 3개 선택
 * 
 * @param category - 상품 카테고리 (선택사항: pistol, explosive, melee, blade, launcher, crossbow)
 * @returns 추천 상품 리스트
 */
export const get_recommendations = async (
  category?: string
): Promise<{ success: boolean; message: string; products?: any[] }> => {
  try {
    console.log('[get_recommendations] 함수 호출:', { category });

    // products 테이블에서 조회
    let query = supabase.from('products').select('*');

    // 카테고리가 있으면 필터링
    if (category) {
      query = query.eq('type', category);
      console.log('[get_recommendations] 카테고리 필터:', category);
    }

    const { data: productsData, error: productsError } = await query;

    if (productsError) {
      console.error('[get_recommendations] products 조회 오류:', productsError);
      return {
        success: false,
        message: "상품 조회 중 오류가 발생했습니다",
      };
    }

    if (!productsData || productsData.length === 0) {
      return {
        success: false,
        message: category 
          ? `"${category}" 카테고리의 상품이 없어요`
          : "추천할 상품이 없어요",
      };
    }

    console.log('[get_recommendations] 조회된 상품:', productsData.length, '개');

    // 랜덤으로 3개 선택
    const shuffled = [...productsData].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    console.log('[get_recommendations] 선택된 상품:', selected.length, '개');

    // 결과 메시지 생성
    let resultMessage = category 
      ? `🎯 ${category} 카테고리 추천 상품 ${selected.length}개\n\n`
      : `🎯 추천 상품 ${selected.length}개\n\n`;

    selected.forEach((product, index) => {
      const name = product.name_kr || product.name;
      const price = product.price || 0;
      const stock = product.stock || 100;
      
      resultMessage += `${index + 1}. ${name}\n`;
      resultMessage += `   가격: ₩${price.toLocaleString()}\n`;
      resultMessage += `   재고: ${stock}개\n`;
      if (product.description) {
        resultMessage += `   설명: ${product.description}\n`;
      }
      resultMessage += `\n`;
    });

    resultMessage += `💡 "${index + 1}번 주문할게요"처럼 번호로 주문할 수 있어요!`;

    return {
      success: true,
      message: resultMessage,
      products: selected
    };

  } catch (error) {
    console.error('[get_recommendations] 예상치 못한 오류:', error);
    return {
      success: false,
      message: "상품 추천 중 오류가 발생했습니다",
    };
  }
};

