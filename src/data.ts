import type { CatalogItem, Design, FurnitureKind } from './types';

export const CATALOG: CatalogItem[] = [
  { kind: 'sofa', name: 'Cloud Sofa', description: 'Soft linen · 3 seats', category: 'Seating', width: 2.4, depth: 1, height: 0.85, color: '#b9ad96' },
  { kind: 'armchair', name: 'Lounge Chair', description: 'Curved comfort · 1 seat', category: 'Seating', width: 0.9, depth: 0.9, height: 0.85, color: '#b97655' },
  { kind: 'table', name: 'Oak Coffee Table', description: 'Solid oak · Round top', category: 'Tables', width: 1.2, depth: 1.2, height: 0.42, color: '#a98154' },
  { kind: 'chair', name: 'Dining Chair', description: 'Oak frame · Woven seat', category: 'Seating', width: 0.52, depth: 0.55, height: 0.85, color: '#aa8864' },
  { kind: 'lamp', name: 'Arc Floor Lamp', description: 'Warm light · Linen shade', category: 'Lighting', width: 0.65, depth: 0.65, height: 1.8, color: '#d9c49c' },
  { kind: 'plant', name: 'Olive Tree', description: 'Ceramic pot · Evergreen', category: 'Decor', width: 0.7, depth: 0.7, height: 1.8, color: '#667454' },
  { kind: 'rug', name: 'Woven Rug', description: 'Natural wool · Handwoven', category: 'Decor', width: 2.8, depth: 2, height: 0.02, color: '#d2c7b4' },
  { kind: 'shelf', name: 'Low Bookshelf', description: 'Walnut · Open storage', category: 'Tables', width: 1.5, depth: 0.4, height: 0.9, color: '#826448' },
  { kind: 'bed', name: 'Daybed', description: 'Linen upholstery · Oak base', category: 'Seating', width: 2, depth: 1.1, height: 0.65, color: '#aaa797' },
  { kind: 'door', name: 'Oak Door', description: 'Wall opening · Brass handle', category: 'Build', width: 0.95, depth: 0.16, height: 2.15, color: '#9c7958' },
  { kind: 'window', name: 'Picture Window', description: 'Wall opening · Oak frame', category: 'Build', width: 1.6, depth: 0.16, height: 1.4, color: '#eee9dc' },
  { kind: 'tv', name: 'Frame TV', description: '55 inch · Low media console', category: 'Appliances', width: 1.6, depth: 0.42, height: 1.15, color: '#8c755b' },
  { kind: 'aircond', name: 'Air Conditioner', description: 'Wall mounted · Quiet cooling', category: 'Appliances', width: 1.05, depth: 0.25, height: 0.34, color: '#eeeae0' },
  { kind: 'fridge', name: 'Refrigerator', description: 'Double door · Brushed finish', category: 'Appliances', width: 0.82, depth: 0.75, height: 1.85, color: '#b7b8b1' },
  { kind: 'washer', name: 'Washing Machine', description: 'Front load · Glass drum', category: 'Appliances', width: 0.65, depth: 0.66, height: 0.9, color: '#e8e6dc' },
];

export const item = (kind: FurnitureKind, x: number, z: number, rotation = 0, color?: string) => ({
  ...CATALOG.find((entry) => entry.kind === kind)!,
  id: crypto.randomUUID(),
  position: [x, 0, z] as [number, number, number],
  rotation,
  scale: 1,
  ...(color ? { color } : {}),
});

export const DEFAULT_DESIGN: Design = {
  name: 'The Sunday Room',
  roomWidth: 6,
  roomDepth: 5,
  wallColor: '#e6dfd2',
  floorColor: '#c5a480',
  lighting: 'daylight',
  items: [
    item('rug', 0, 0.4, 0, '#d4c9b6'),
    item('sofa', -0.6, -1.5, 0, '#b4ac97'),
    item('table', -0.4, 0.25, 0, '#a9845c'),
    item('armchair', 1.9, 0.4, -0.6, '#b57858'),
    item('lamp', -2.25, -1.75),
    item('plant', 2.25, -1.65),
    item('shelf', 1.5, -2.12),
    item('window', 1.55, -2.48),
  ],
};

export const WALL_COLORS = ['#e6dfd2', '#f1eee6', '#ccd3c5', '#c9b5a4', '#acbcb9', '#d4c9bc'];
export const FLOOR_COLORS = ['#c5a480', '#9f7956', '#d2bd9c', '#8a8173', '#b8b6ad'];

export function isDesign(value: unknown): value is Design {
  if (!value || typeof value !== 'object') return false;
  const design = value as Design;
  return typeof design.name === 'string'
    && design.roomWidth >= 3 && design.roomWidth <= 12
    && design.roomDepth >= 3 && design.roomDepth <= 12
    && ['daylight', 'golden', 'studio'].includes(design.lighting)
    && typeof design.wallColor === 'string' && typeof design.floorColor === 'string'
    && Array.isArray(design.items)
    && design.items.length <= 100
    && design.items.every((entry) =>
      entry && typeof entry.id === 'string'
      && CATALOG.some((catalogItem) => catalogItem.kind === entry.kind)
      && Array.isArray(entry.position) && entry.position.length === 3
      && entry.position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
      && typeof entry.rotation === 'number' && Number.isFinite(entry.rotation)
      && typeof entry.scale === 'number' && entry.scale >= 0.5 && entry.scale <= 2,
    );
}
