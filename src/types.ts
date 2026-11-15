export type FurnitureKind = 'sofa' | 'armchair' | 'table' | 'chair' | 'lamp' | 'plant' | 'rug' | 'shelf' | 'bed' | 'door' | 'window' | 'tv' | 'aircond' | 'fridge' | 'washer';
export type FurnitureCategory = 'Seating' | 'Tables' | 'Lighting' | 'Decor' | 'Build' | 'Appliances';
export type LightingPreset = 'daylight' | 'golden' | 'studio';

export interface CatalogItem {
  kind: FurnitureKind;
  name: string;
  description: string;
  category: FurnitureCategory;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface FurnitureItem extends CatalogItem {
  id: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface Design {
  name: string;
  roomWidth: number;
  roomDepth: number;
  wallColor: string;
  floorColor: string;
  lighting: LightingPreset;
  items: FurnitureItem[];
}

export interface SavedDesign extends Design {
  id: string;
  savedAt: string;
}
