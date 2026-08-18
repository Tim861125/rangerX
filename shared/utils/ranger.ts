export const DEFAULT_RANGER_IMAGE_ORIGIN = 'https://res.warmycat.com'
export const RANGER_IMAGE_ORIGIN = DEFAULT_RANGER_IMAGE_ORIGIN

export function getRangerImagePath(rangerId: string): string {
  const encodedId = encodeURIComponent(rangerId)
  return `/${encodedId}/${encodedId}-thum.png`
}

export function getRangerImageUrl(rangerId: string, customOrigin?: string): string {
  const origin = (customOrigin && customOrigin.trim() !== '')
    ? customOrigin.trim().replace(/\/+$/, '')
    : DEFAULT_RANGER_IMAGE_ORIGIN

  return `${origin}${getRangerImagePath(rangerId)}`
}
