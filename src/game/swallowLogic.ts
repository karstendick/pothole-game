// Pure functions for swallowing mechanics that can be tested without BabylonJS dependencies

export function canSwallow(
  holeRadius: number,
  objectRadius: number,
  distanceToObject: number,
): boolean {
  const edgeDistance = distanceToObject - objectRadius
  return edgeDistance < holeRadius * 0.9 && objectRadius < holeRadius
}

export function calculateGrowth(objectRadius: number, growthRate: number): number {
  return objectRadius * growthRate
}
