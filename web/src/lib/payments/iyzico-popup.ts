/** Iyzico checkout popup. */
export const IYZICO_POPUP_NAME = "eserpromo_iyzico_pay";

const POPUP_WIDTH = 840;
const POPUP_HEIGHT = 750;

export function iyzicoPopupFeatures() {
  if (typeof window === "undefined") {
    return `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes`;
  }

  const left = Math.max(0, Math.round((window.screen.availWidth - POPUP_WIDTH) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - POPUP_HEIGHT) / 2));

  return [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=yes",
    "status=yes",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
}
