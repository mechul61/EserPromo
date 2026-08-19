export type CustomerKpi = {
  label: string;
  value: string;
  delta: number;
  color: string;
  icon: "total" | "active" | "new" | "orders" | "spend";
};

export type CustomerStatus = "active" | "passive" | "blocked";
export type CustomerGroupId = "retail" | "wholesale" | "vip";
export type CustomerSourceId = "website" | "social" | "email" | "other";

export type CustomerRow = {
  id: string;
  publicNo: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  customerGroup: CustomerGroupId;
  source: CustomerSourceId;
  isActive: boolean;
  blocked: boolean;
  status: CustomerStatus;
  orderCount: number;
  spend: number;
  createdAt: string;
  isNew: boolean;
};

export type CustomerShare = {
  id: string;
  name: string;
  count: number;
  percent: number;
  color: string;
};

export type CustomerSourceShare = {
  id: CustomerSourceId;
  name: string;
  percent: number;
};

export type TopSpender = {
  id: string;
  name: string;
  initials: string;
  spend: number;
};
