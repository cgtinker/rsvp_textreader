/**
 * Measures typographic ink bounds for the current monospace font using the
 * Canvas 2D text metrics API and returns CSS custom property values as
 * percentage strings relative to the stage element's height.
 *
 * @param stageEl - The full-viewport stage container (used as the height reference)
 * @param capRef  - A rendered span whose computed font style is used for measurement
 * @returns An object mapping CSS var names to percentage strings, ready for
 *          `element.style.setProperty(key, value)`.
 */
export function measureTypography(
  stageEl: HTMLElement,
  capRef: HTMLElement,
): Record<string, string> {
  const sr = stageEl.getBoundingClientRect();
  const lineBox = capRef.getBoundingClientRect();

  const style = getComputedStyle(capRef);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  const mH = ctx.measureText('H');
  const mx = ctx.measureText('x');
  const mp = ctx.measureText('p');

  // fontBoundingBox values give the full em-square height. Normalize the
  // baseline position against the actual rendered line-box height so the
  // guide lines sit exactly on the ink, regardless of line-height.
  const emH = mH.fontBoundingBoxAscent + mH.fontBoundingBoxDescent;
  const baselineY =
    lineBox.top - sr.top + (mH.fontBoundingBoxAscent / emH) * lineBox.height;

  const h = sr.height;
  const pct = (y: number) => `${((y / h) * 100).toFixed(2)}%`;

  return {
    '--text-cap-top': pct(baselineY - mH.actualBoundingBoxAscent),
    '--text-xheight': pct(baselineY - mx.actualBoundingBoxAscent),
    '--text-bottom':  pct(baselineY + mx.actualBoundingBoxDescent),
    '--text-descender': pct(baselineY + mp.actualBoundingBoxDescent),
  };
}
