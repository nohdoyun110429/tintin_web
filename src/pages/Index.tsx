import { useState } from "react";
import { Product, CartItem } from "@/types/product";
import { products } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BestProductsCarousel from "@/components/BestProductsCarousel";
import ProductGrid from "@/components/ProductGrid";
import ProductDetailModal from "@/components/ProductDetailModal";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import ChatButton from "@/components/ChatButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "결제를 위해 로그인이 필요합니다.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

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
      // 주문번호 생성 (ORD-YYYYMMDD-HHMMSS-RANDOM)
      const now = new Date();
      const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // 총 금액 계산
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      // 구매 항목 정보 생성
      const items = cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productNameKr: item.product.nameKr,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));

      // DB에 결제 내역 저장
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          amount: totalAmount,
          status: 'completed',
          items: items
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "WEAPONS DEPLOYED",
        description: `주문번호: ${orderNumber}. Your arsenal is ready for combat. Good hunting.`,
        className: "bg-primary text-primary-foreground border-none",
      });

      // 장바구니 비우기
      setCartItems([]);
      setIsCartOpen(false);
    } catch (error: any) {
      console.error('결제 처리 실패:', error);
      toast({
        title: "결제 실패",
        description: error.message || "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCheckout(false);
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

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleAddToCart}
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

      <ChatButton />
    </div>
  );
};

export default Index;
