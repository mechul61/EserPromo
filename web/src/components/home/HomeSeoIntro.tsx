import Link from "next/link";

export function HomeSeoIntro() {
  return (
    <section className="mt-3 rounded-md border border-line bg-white px-4 py-3.5 sm:px-5">
      <h1 className="text-[17px] font-extrabold tracking-wide text-navy uppercase sm:text-[19px]">
        Promosyon Ürünleri ve Kurumsal Hediyelik
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#555]">
        <strong className="font-semibold text-[#333]">Promosyon</strong> ve logolu kurumsal hediye tedarikinde kalem,
        ajanda, tekstil, termos ve teknoloji ürünlerinde geniş katalog. Toplu alım teklifi, hızlı numune ve Türkiye
        geneli kargo.{" "}
        <Link href="/promosyon/" className="font-semibold text-navy underline underline-offset-2">
          Promosyon rehberi
        </Link>
        {" · "}
        <Link href="/urunler/" className="font-semibold text-navy underline underline-offset-2">
          Tüm promosyon ürünleri
        </Link>
      </p>
    </section>
  );
}
