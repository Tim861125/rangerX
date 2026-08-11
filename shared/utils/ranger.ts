export const RANGER_IMAGE_ORIGIN = 'https://res.warmycat.com'

export function getRangerImageUrl(rangerId: string): string {
  const encodedId = encodeURIComponent(rangerId)
  return `${RANGER_IMAGE_ORIGIN}/${encodedId}/${encodedId}-thum.png`
}
