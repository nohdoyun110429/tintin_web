import { useState } from "react";
import { Product, CartItem } from "@/types/product";
import { products } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BestProductsCarousel from "@/components/BestProductsCarousel";
import ProductGrid from "@/components/ProductGrid";
import ProductDetailModal from "@/components/ProductDetailModal";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { useToast } from "@/hooks/use-toast";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const TOSS_CLIENT_KEY = "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast({
      title: "WEAPON ACQUIRED",
      description: `${product.name} has been added to your loadout.`,
      className: "bg-card border-primary text-foreground",
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const createOrderId = () => {
    const now = new Date();
    return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const buildOrderName = (items: CartItem[]) => {
    if (items.length === 1) {
      return items[0].product.name;
    }
    const [first, ...rest] = items;
    return `${first.product.name} 외 ${rest.length}건`;
  };

  const requestPayment = async (amount: number, orderName: string, items?: CartItem[]) => {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
    const orderId = createOrderId();
    const customerKey = user?.id ?? `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const payment = tossPayments.payment({ customerKey });
    const successUrl = `${window.location.origin}/payment/success?orderId=${orderId}`;
    const failUrl = `${window.location.origin}/payment/fail`;
    const customerEmail = user?.email ?? undefined;
    const customerName = user?.email?.split("@")[0] ?? "GUEST";

    // 결제 정보를 localStorage에 저장 (결제 성공 후 DB 저장용)
    const paymentData = {
      orderId,
      orderName,
      amount,
      items: items?.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productNameKr: item.product.nameKr,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      })) || []
    };
    localStorage.setItem(`payment_${orderId}`, JSON.stringify(paymentData));

    await payment.requestPayment({
      method: "CARD",
      amount: {
        value: amount,
        currency: "KRW",
      },
      orderId,
      orderName,
      successUrl,
      failUrl,
      customerEmail,
      customerName,
    });
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "장바구니가 비어있습니다",
        description: "결제할 상품이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      await requestPayment(totalAmount, buildOrderName(cartItems), cartItems);
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      toast({
        title: "결제 실패",
        description: error.message || "결제 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleBuyNow = async (product: Product) => {
    try {
      // 단일 상품 구매를 CartItem 형태로 변환
      const singleItem: CartItem = { product, quantity: 1 };
      await requestPayment(product.price, product.name, [singleItem]);
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      toast({
        title: "결제 실패",
        description: error.message || "결제 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background noise-overlay scan-lines">
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <main>
        <HeroSection />
        <BestProductsCarousel
          products={products}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
        />
        <ProductGrid 
          products={products}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
        />
      </main>

      <Footer />
      <ChatWidget onAddToCart={handleAddToCart} />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleAddToCart}
        onPurchase={handleBuyNow}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        isProcessingCheckout={isProcessingCheckout}
      />


    </div>
  );
};

export default Index;
