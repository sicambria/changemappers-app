/**
 * App-level overlay stacking scale.
 *
 * Tailwind's JIT scanner only generates CSS for complete class strings, so the
 * constants here are full `z-[...]` class literals, never interpolated values.
 * Component-internal stacking (e.g. energy canvas layers 0-15) stays local and
 * is intentionally not part of this scale.
 *
 * Layering order (low → high):
 *   90          floating affordances (feedback button)
 *   100         tool-page local overlays (Excalidraw exit dialog)
 *   999/1000    map surface overlays and Leaflet-adjacent panels
 *   1100        dropdowns above map panels
 *   2000        sticky app header / standard modal overlays
 *   2100        header dropdown menus
 *   2200/2201   overlays above header chrome (guided tour, language menu)
 *   3000        profile/journey modals (above tours)
 *   9998/9999   bottom banner / cookie consent / hover cards (top chrome)
 *   2147483647  feedback modal (absolute top, above all third-party widgets)
 */
export const Z_CLASS = {
  /** Floating feedback button. */
  floatingButton: 'z-[90]',
  /** Tool-page local overlay (e.g. Excalidraw exit confirmation). */
  toolOverlay: 'z-[100]',
  /** Click-away backdrop directly under map overlays. */
  mapBackdrop: 'z-[999]',
  /** Map control panels, cluster overlays, panels over map surfaces. */
  mapOverlay: 'z-[1000]',
  /** `md:`-scoped variant of mapOverlay (homepage hero card over the map). */
  mapOverlayMd: 'md:z-[1000]',
  /** Dropdown lists that must clear map overlay panels. */
  mapDropdown: 'z-[1100]',
  /** Sticky app header. */
  header: 'z-[2000]',
  /** Standard centered modal overlays (same layer as the header). */
  modalOverlay: 'z-[2000]',
  /** Header dropdown menus. */
  headerDropdown: 'z-[2100]',
  /** Overlays that must clear header chrome (tour backdrop, language menu). */
  aboveHeader: 'z-[2200]',
  /** Guided tour popovers (above the tour backdrop). */
  aboveHeaderPopover: 'z-[2201]',
  /** Profile edit/journey modals (above tours). */
  profileModal: 'z-[3000]',
  /** Persistent bottom banner. */
  bottomBanner: 'z-[9998]',
  /** Cookie consent, completeness modal, hover cards — top app chrome. */
  topChrome: 'z-[9999]',
  /** Feedback modal: must beat every widget, including third-party embeds. */
  feedbackModal: 'z-[2147483647]',
} as const;

export type ZClassName = keyof typeof Z_CLASS;
