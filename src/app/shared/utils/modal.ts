/** No celular o modal abre como folha deslizante; no desktop, centralizado. */
export function opcoesModal(alturaFolha = 0.9): {
  cssClass: string;
  breakpoints?: number[];
  initialBreakpoint?: number;
} {
  const desktop = window.matchMedia('(min-width: 768px)').matches;
  return desktop
    ? { cssClass: 'fm-modal' }
    : { cssClass: 'fm-modal', breakpoints: [0, alturaFolha, 1], initialBreakpoint: alturaFolha };
}
