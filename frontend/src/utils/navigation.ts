export const REALRENT_NAVIGATION_EVENT = 'realrent:navigation'

export function navigateTo(url: string) {
  window.history.pushState({}, '', url)
  window.dispatchEvent(new Event(REALRENT_NAVIGATION_EVENT))
}
