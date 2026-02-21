import { Product } from "@/types/product";
import WeaponCard from "./WeaponCard";
import { Skull } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductGrid = ({ products, onAddToCart, onViewDetails }: ProductGridProps) => {
  const regularProducts = products.filter(p => !p.isRecommended);
  const featuredProduct = products.find(p => p.isRecommended);

  return (
    <section id="weapons" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary" />
            <Skull className="h-8 w-8 text-primary" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-foreground tracking-widest mb-2">
            ARSENAL
          </h2>
          <p className="text-muted-foreground">무기고</p>
        </div>

        {/* Featured product */}
        {featuredProduct && (
          <div id="featured" className="mb-12">
            <h3 className="font-display text-xl text-primary tracking-widest mb-4 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              WEAPON OF MASS DESTRUCTION
            </h3>
            <div className="max-w-2xl mx-auto">
              <WeaponCard 
                product={featuredProduct} 
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          </div>
        )}

        {/* Regular products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {regularProducts.map((product, index) => (
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

export default ProductGrid;
