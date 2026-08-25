/** Iyzico checkout popup — masaüstü iki sütun formuna uygun geniş pencere. */
export const IYZICO_POPUP_NAME = "eserpromo_iyzico_pay";

export function iyzicoPopupFeatures() {
  if (typeof window === "undefined") {
    return "width=1100,height=820,menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes";
  }

  const width = Math.min(1100, Math.max(960, window.screen.availWidth - 100));
  const height = Math.min(860, Math.max(740, window.screen.availHeight - 100));
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));

  return [
    `width=${width}`,
    `height=${height}`,
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
