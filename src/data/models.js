// ─────────────────────────────────────────────────────────────
//  TRIPO MODEL SLOTS
//
//  Drop a GLB with the matching file name into /public/models and
//  it replaces the placeholder automatically on the next reload.
//  The model is auto-scaled to `size` and sat on the ground.
//
//    fit: 'height'  -> the model is scaled so it is `size` units tall
//    fit: 'width'   -> the model is scaled so it is `size` units wide
//    rotateY        -> turn it (radians) if it faces the wrong way
//    offset         -> nudge it [x, y, z]
//    scale          -> extra multiplier after the auto-fit
//    shine          -> stronger reflections, for metallic paint that looks too dark (try 2-3)
// ─────────────────────────────────────────────────────────────
export const MODEL_SLOTS = {
  figure: { file: 'figure.glb', fit: 'height', size: 2.75, rotateY: 0, offset: [0, 0, 0], scale: 1 },
  lowrider: { file: 'lowrider.glb', fit: 'width', size: 4.8, rotateY: -Math.PI / 2, offset: [0, 0, 0], scale: 1, shine: 2.6 },
  wall: { file: 'wall.glb', fit: 'width', size: 9.8, rotateY: 0, offset: [0, 0, 0], scale: 1 },
  shop: { file: 'shop.glb', fit: 'width', size: 7, rotateY: 0, offset: [0, 0, -0.2], scale: 0.92 },
  storefront: { file: 'storefront.glb', fit: 'width', size: 5.5, rotateY: 0, offset: [0, 0, 0.68], scale: 1 },
  pawnshop: { file: 'pawnshop.glb', fit: 'width', size: 4.5, rotateY: 0, offset: [0, 0, 0.85], scale: 1 },
  court: { file: 'court.glb', fit: 'width', size: 9, rotateY: 0, offset: [0, 0, 0], scale: 1 },
  boombox: { file: 'boombox.glb', fit: 'width', size: 1.15, rotateY: 0, offset: [0, 0, 0], scale: 1 },
  payphone: { file: 'payphone.glb', fit: 'height', size: 2.6, rotateY: 0, offset: [0, 0, 0], scale: 1 },
}
