import { AirVent, Armchair, BookOpen, DoorOpen, LampFloor, Leaf, PanelTop, RectangleHorizontal, Refrigerator, Square, Table2, Tv, WashingMachine } from 'lucide-react';
import type { FurnitureKind } from './types';

export function FurniturePreview({ kind, color }: { kind: FurnitureKind; color: string }) {
  const props = { size: 42, strokeWidth: 1.25, color };
  if (kind === 'plant') return <Leaf {...props} />;
  if (kind === 'lamp') return <LampFloor {...props} />;
  if (kind === 'table') return <Table2 {...props} />;
  if (kind === 'shelf') return <BookOpen {...props} />;
  if (kind === 'rug') return <RectangleHorizontal {...props} />;
  if (kind === 'bed') return <Square {...props} />;
  if (kind === 'door') return <DoorOpen {...props} />;
  if (kind === 'window') return <PanelTop {...props} />;
  if (kind === 'tv') return <Tv {...props} />;
  if (kind === 'aircond') return <AirVent {...props} />;
  if (kind === 'fridge') return <Refrigerator {...props} />;
  if (kind === 'washer') return <WashingMachine {...props} />;
  return <Armchair {...props} />;
}
