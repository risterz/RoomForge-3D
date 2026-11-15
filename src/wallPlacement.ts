import type { FurnitureItem } from './types';

export function isWallMounted(item: Pick<FurnitureItem, 'kind'>) {
  return item.kind === 'door' || item.kind === 'window' || item.kind === 'aircond';
}

export function getWallPlacement(item: Pick<FurnitureItem, 'position' | 'rotation' | 'width' | 'scale'>, roomWidth: number, roomDepth: number): Pick<FurnitureItem, 'position' | 'rotation'> {
  const leftWall = Math.abs(item.rotation) > 0.1;
  const alongWall = leftWall ? item.position[2] : item.position[0];
  const halfWallLength = (leftWall ? roomDepth : roomWidth) / 2;
  const halfWidth = item.width * item.scale / 2;
  const center = Math.max(-halfWallLength + halfWidth, Math.min(halfWallLength - halfWidth, alongWall));
  return {
    position: leftWall ? [-roomWidth / 2, 0, center] : [center, 0, -roomDepth / 2],
    rotation: leftWall ? Math.PI / 2 : 0,
  };
}
