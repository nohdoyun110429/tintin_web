export interface Product {
  id: string;
  name: string;
  nameKr: string;
  description: string;
  price: number;
  imageUrl: string;
  damage: number;
  fireRate: number;
  weight: number;
  type: 'pistol' | 'explosive' | 'melee' | 'blade' | 'launcher' | 'crossbow';
  isRecommended?: boolean;
  lore: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
