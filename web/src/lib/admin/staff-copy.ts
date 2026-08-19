export const STAFF_ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editör",
  support: "Müşteri Temsilcisi",
  content: "İçerik Yöneticisi",
} as const;

export type StaffRoleId = keyof typeof STAFF_ROLE_LABEL;

export const STAFF_ROLE_TONE: Record<StaffRoleId, string> = {
  super_admin: "bg-[#f1e9ff] text-[#7c3aed]",
  admin: "bg-[#e8f0ff] text-[#2563eb]",
  editor: "bg-[#fff4e5] text-[#d97706]",
  support: "bg-[#ccfbf1] text-[#0f766e]",
  content: "bg-[#e9f9ef] text-[#16a34a]",
};

export const STAFF_ROLE_COLOR: Record<StaffRoleId, string> = {
  super_admin: "#7c3aed",
  admin: "#2563eb",
  editor: "#d97706",
  support: "#14b8a6",
  content: "#16a34a",
};

export const STAFF_ROLE_HINT: Record<StaffRoleId, string> = {
  super_admin: "Tüm panele, personel ve güvenlik ayarlarına erişir.",
  admin: "Panele erişir; personel ekleyip düzenleyebilir. Super Admin atayamaz.",
  editor: "Panele erişir; katalog ve içerik sayfalarını yönetir.",
  support: "Panele erişir; sipariş, müşteri ve destek taleplerini yönetir.",
  content: "Panele erişir; banner, popup ve içerik alanlarını yönetir.",
};

export function isStaffRole(role: string): role is StaffRoleId {
  return role in STAFF_ROLE_LABEL;
}

export function canManageStaff(role: string) {
  return role === "super_admin" || role === "admin";
}

export function usernameFromEmail(email: string) {
  return email.split("@")[0] || email;
}
