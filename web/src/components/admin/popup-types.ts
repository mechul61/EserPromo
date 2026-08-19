import {
  POPUP_AUDIENCE_LABEL,
  POPUP_DEVICE_LABEL,
  POPUP_KIND_LABEL,
  POPUP_PLACEMENT_LABEL,
  POPUP_STATUS_LABEL,
  type PopupAudienceId,
  type PopupDeviceId,
  type PopupKindId,
  type PopupPlacementId,
  type PopupStatusId,
} from "@/lib/commerce/popups";

export {
  POPUP_AUDIENCE_LABEL,
  POPUP_DEVICE_LABEL,
  POPUP_KIND_LABEL,
  POPUP_PLACEMENT_LABEL,
  POPUP_STATUS_LABEL,
};

export type { PopupAudienceId, PopupDeviceId, PopupKindId, PopupPlacementId, PopupStatusId };

export type PopupKpi = {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  color: string;
  icon: "total" | "active" | "planned" | "passive" | "views";
};

export type PopupRow = {
  id: string;
  title: string;
  description: string;
  kind: PopupKindId;
  placement: PopupPlacementId;
  device: PopupDeviceId;
  audience: PopupAudienceId;
  status: PopupStatusId;
  isDraft: boolean;
  isActive: boolean;
  image: string;
  imagePath: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  couponCode: string;
  startsAt: string | null;
  endsAt: string | null;
  views: number;
  clicks: number;
  conversions: number;
  delaySeconds: number;
  frequencyHours: number;
  sortOrder: number;
};

export type PopupSettings = {
  enabled: boolean;
  defaultDelay: number;
  defaultFrequency: number;
};

export type PopupMonthStats = {
  views: number;
  clicks: number;
  conversions: number;
  subscribers: number;
  viewsDelta: number;
  clicksDelta: number;
  conversionsDelta: number;
};
