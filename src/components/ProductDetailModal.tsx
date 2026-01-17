import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Flame, Weight, AlertTriangle, Star } from "lucide-react";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onPurchase: (product: Product) => void;
}

const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart, onPurchase }: ProductDetailModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-display text-3xl tracking-widest text-foreground">
                {product.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{product.nameKr}</p>
            </div>
            {product.isRecommended && (
              <Badge className="bg-primary text-primary-foreground font-display">
                <Star className="h-3 w-3 mr-1" />
                RECOMMENDED
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image placeholder */}
          <div className="relative h-48 bg-gradient-to-b from-blood/30 to-card rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-8xl opacity-40">
              {product.type === 'pistol' && '🔫'}
              {product.type === 'explosive' && '💣'}
              {product.type === 'melee' && '🪚'}
              {product.type === 'blade' && '⚔️'}
              {product.type === 'launcher' && '🚀'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          </div>

          {/* Type and description */}
          <div>
            <Badge variant="outline" className="border-primary/50 text-primary uppercase mb-3">
              {product.type}
            </Badge>
            <p className="text-foreground font-semibold mb-2">{product.description}</p>
          </div>

          {/* Stats */}
          <div className="space-y-4 bg-secondary/30 rounded-lg p-4">
            <h4 className="font-display text-lg tracking-wider text-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              WEAPON STATS
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Flame className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground w-20">DAMAGE</span>
                <Progress value={product.damage} className="flex-1 h-2" />
                <span className="text-sm font-bold text-foreground w-12 text-right">{product.damage}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Crosshair className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground w-20">FIRE RATE</span>
                <Progress value={product.fireRate} className="flex-1 h-2" />
                <span className="text-sm font-bold text-foreground w-12 text-right">{product.fireRate}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Weight className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground w-20">WEIGHT</span>
                <Progress value={product.weight} className="flex-1 h-2" />
                <span className="text-sm font-bold text-foreground w-12 text-right">{product.weight}%</span>
              </div>
            </div>
          </div>

          {/* Lore */}
          <div className="bg-blood/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-display text-sm tracking-widest text-primary mb-2">
              // CLASSIFIED INTEL
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{product.lore}"
            </p>
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border gap-4">
            <div>
              <span className="text-xs text-muted-foreground">PRICE</span>
              <p className="font-display text-3xl text-primary">
                {product.price.toLocaleString()} <span className="text-lg">GOLD</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  onPurchase(product);
                }}
                className="text-lg"
              >
                구매하기
              </Button>
              <Button 
                variant="weapon" 
                size="lg"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="text-lg"
              >
                무장하기
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
