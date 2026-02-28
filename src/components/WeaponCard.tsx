import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Flame, Shield, Star } from "lucide-react";
import { useState } from "react";

interface WeaponCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const WeaponCard = ({ product, onAddToCart, onViewDetails }: WeaponCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 500);
  };

  const getTypeIcon = () => {
    switch (product.type) {
      case 'pistol':
        return <Crosshair className="h-3 w-3" />;
      case 'explosive':
        return <Flame className="h-3 w-3" />;
      case 'melee':
      case 'blade':
        return <Shield className="h-3 w-3" />;
      case 'launcher':
        return <Star className="h-3 w-3" />;
      case 'crossbow':
        return <Crosshair className="h-3 w-3" />;
      default:
        return <Crosshair className="h-3 w-3" />;
    }
  };

  return (
    <Card 
      className={`
        group relative overflow-hidden bg-gradient-card border-border 
        hover:border-primary/50 transition-all duration-300 cursor-pointer
        ${isHovered ? 'shadow-[0_0_30px_hsl(var(--primary)/0.3)]' : ''}
        ${product.isRecommended ? 'ring-2 ring-primary/50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(product)}
    >
      {/* Recommended badge */}
      {product.isRecommended && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-primary-foreground font-display tracking-wider animate-pulse-glow">
            <Star className="h-3 w-3 mr-1" />
            RECOMMENDED
          </Badge>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="outline" className="border-primary/50 text-primary uppercase text-xs">
          {getTypeIcon()}
          <span className="ml-1">{product.type}</span>
        </Badge>
      </div>

      {/* Image container */}
      <div className="relative h-48 bg-gradient-to-b from-blood/20 to-transparent overflow-hidden">
        {/* Actual product image */}
        {product.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`
                max-h-full max-w-full w-auto h-auto object-contain
                transition-all duration-300
                ${isHovered ? 'scale-110 opacity-100' : 'opacity-100'}
                ${isHovered ? 'animate-glitch' : ''}
              `}
              style={{
                filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.3))',
                minHeight: '120px',
                minWidth: '120px',
              }}
              onError={(e) => {
                console.error('Image load error:', product.imageUrl);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', product.imageUrl);
              }}
            />
          </div>
        ) : null}
        
        {/* Placeholder weapon silhouette (fallback) */}
        {!product.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`
              text-6xl opacity-30 group-hover:opacity-50 transition-opacity
              ${isHovered ? 'animate-glitch' : ''}
            `}>
              {product.type === 'pistol' && '🔫'}
              {product.type === 'explosive' && '💣'}
              {product.type === 'melee' && '🪚'}
              {product.type === 'blade' && '⚔️'}
              {product.type === 'launcher' && '🚀'}
              {product.type === 'crossbow' && '🏹'}
            </div>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className={`
          absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity
        `} />
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="font-display text-xl text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{product.nameKr}</p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Quick stats */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">DMG</span>
            <span className="text-foreground font-bold">{product.damage}</span>
          </div>
          <div className="flex items-center gap-1">
            <Crosshair className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">RATE</span>
            <span className="text-foreground font-bold">{product.fireRate}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Price */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Price</span>
          <span className="font-display text-xl text-primary">
            {product.price.toLocaleString()} <span className="text-sm">GOLD</span>
          </span>
        </div>

        {/* Add to cart button */}
        <Button 
          variant="weapon" 
          size="sm"
          onClick={handleAddToCart}
          className={isAdding ? 'animate-shake bg-primary' : ''}
        >
          {isAdding ? '✓' : '장착하기'}
        </Button>
      </CardFooter>

      {/* Blood drip effect on hover */}
      {isHovered && (
        <div className="absolute top-0 left-1/4 w-0.5 bg-gradient-to-b from-primary to-transparent h-0 animate-[blood-drip_1s_ease-out]" />
      )}
    </Card>
  );
};

export default WeaponCard;
