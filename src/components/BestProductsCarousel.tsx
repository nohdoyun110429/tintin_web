import { Product } from "@/types/product";
import WeaponCard from "./WeaponCard";
import { Star } from "lucide-react";

interface BestProductsCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const BestProductsCarousel = ({ products, onAddToCart, onViewDetails }: BestProductsCarouselProps) => {
  // damage가 높은 상위 제품들을 베스트 상품으로 선정 (최대 4개)
  const bestProducts = [...products]
    .sort((a, b) => b.damage - a.damage)
    .slice(0, 4);

  if (bestProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background via-background to-background/95 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-widest">
                WEEKLY BEST
              </h2>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
          </div>
          <p className="text-sm text-muted-foreground">주간 베스트</p>
        </div>

        {/* Products - 모바일: 가로 스크롤, 데스크톱: 그리드 */}
        {/* 모바일: 가로 스크롤 가능한 flex 레이아웃 */}
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-2 scroll-smooth lg:hidden">
          {bestProducts.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-80 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <WeaponCard
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
        
        {/* 데스크톱: 그리드 레이아웃 */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
          {bestProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <WeaponCard
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestProductsCarousel;

