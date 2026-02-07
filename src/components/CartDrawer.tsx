import { CartItem, Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, Rocket, ShoppingCart } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  isProcessingCheckout?: boolean;
}

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout,
  isProcessingCheckout = false
}: CartDrawerProps) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-widest text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            LOADOUT
          </SheetTitle>
          <p className="text-sm text-muted-foreground">장비 목록</p>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-display tracking-wider">
              NO WEAPONS SELECTED
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              무기를 선택하세요
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.product.id}
                  className="bg-secondary/30 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Item icon */}
                    <div className="w-16 h-16 bg-blood/20 rounded flex items-center justify-center text-3xl">
                      {item.product.type === 'pistol' && '🔫'}
                      {item.product.type === 'explosive' && '💣'}
                      {item.product.type === 'melee' && '🪚'}
                      {item.product.type === 'blade' && '⚔️'}
                      {item.product.type === 'launcher' && '🚀'}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-lg tracking-wider text-foreground truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{item.product.nameKr}</p>
                      <p className="text-primary font-display mt-1">
                        {item.product.price.toLocaleString()} GOLD
                      </p>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-display text-lg w-8 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Line total */}
                  <div className="text-right mt-2">
                    <span className="text-sm text-muted-foreground">Subtotal: </span>
                    <span className="font-display text-foreground">
                      {(item.product.price * item.quantity).toLocaleString()} GOLD
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="text-foreground">{itemCount}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="font-display text-lg tracking-wider text-muted-foreground">TOTAL</span>
                  <span className="font-display text-2xl text-primary">
                    {total.toLocaleString()} <span className="text-sm">GOLD</span>
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <Button 
                variant="danger" 
                size="xl" 
                className="w-full group"
                onClick={onCheckout}
                disabled={isProcessingCheckout}
              >
                <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                {isProcessingCheckout ? "결제 요청 중..." : "구매하기"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                결제 진행
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
