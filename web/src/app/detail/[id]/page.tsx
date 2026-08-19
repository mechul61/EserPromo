import { notFound, permanentRedirect } from "next/navigation";
import { resolveProduct } from "@/lib/catalog";
import { productPath } from "@/lib/seo/urls";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Eski WordPress /detail/{etkinId} URL'lerini kalıcı olarak /urun/{slug}/ adresine yönlendirir. */
export default async function LegacyDetailRedirectPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const resolved = await resolveProduct(String(id));
  if (!resolved) notFound();
  if (resolved.kind === "redirect") {
    permanentRedirect(productPath(resolved.to));
  }

  permanentRedirect(productPath(resolved.product.slug));
}
