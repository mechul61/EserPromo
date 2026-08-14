import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";

export function CatalogWhatsAppFab() {
  return (
    <a
      href={SITE_CONTACT.whatsappHref}
      aria-label="WhatsApp"
      className="fixed bottom-5 left-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
