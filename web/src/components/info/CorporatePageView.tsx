import Image from "next/image";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Factory,
  Heart,
  Home,
  Leaf,
  PencilRuler,
  Smile,
  ShieldCheck,
  Target,
  Truck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";

const WHY_US = [
  { Icon: Award, title: "Deneyim", text: "17+ yıllık sektör tecrübesi" },
  { Icon: Award, title: "Kalite", text: "Kaliteli ürün ve baskı garantisi" },
  { Icon: ShieldCheck, title: "Güven", text: "Zamanında teslimat ve güvenilir hizmet" },
  { Icon: Target, title: "Çözüm Odaklı", text: "İhtiyacınıza özel yaratıcı çözümler" },
  { Icon: Smile, title: "Müşteri Memnuniyeti", text: "%100 müşteri memnuniyeti hedefi" },
] as const;

const JOURNEY = [
  { year: "2007", label: "Kuruluş" },
  { year: "2010", label: "Baskı Çözümleri" },
  { year: "2013", label: "Ürün Yelpazesi\nGenişletme" },
  { year: "2016", label: "Kurumsal Yapılanma" },
  { year: "2019", label: "Dijitalleşme ve\nTeknoloji Yatırımı" },
  { year: "2022", label: "Yeni Üretim\nTesisimize Geçiş" },
  { year: "2024+", label: "Daha İleriye" },
] as const;

const VALUES = [
  {
    Icon: Heart,
    title: "Müşteri Odaklılık",
    text: "Müşterilerimizin ihtiyaçlarını dinliyor, en uygun ve etkili çözümleri sunuyoruz.",
  },
  {
    Icon: Factory,
    title: "Kaliteli Üretim",
    text: "Modern makine parkurumuz ve uzman kadromuzla kaliteli üretim yapıyoruz.",
  },
  {
    Icon: Truck,
    title: "Zamanında Teslimat",
    text: "Söz verdiğimiz zamanda, eksiksiz teslimat gerçekleştiriyoruz.",
  },
  {
    Icon: PencilRuler,
    title: "Yaratıcı Tasarım",
    text: "Markanıza değer katacak özgün tasarım ve baskı desteği sağlıyoruz.",
  },
  {
    Icon: Leaf,
    title: "Sürdürülebilirlik",
    text: "Çevreye duyarlı üretim ve ambalaj çözümleriyle geleceğe değer katıyoruz.",
  },
] as const;

const SERVICES = [
  { src: "/brand/about-print.jpg", title: "Baskı Çözümleri", sub: "UV Baskı · Dijital Baskı · Lazer" },
  { src: "/brand/about-laser.jpg", title: "Lazer Çözümleri", sub: "Lazer Kesim · Lazer Markalama" },
  { src: "/brand/about-gifts.jpg", title: "Özel Tasarım", sub: "Tasarım · Prototip · Özel Üretim" },
  { src: "/brand/about-gifts.jpg", title: "Kurumsal Hediye", sub: "Özel Kutu · Set · Premium Ürünler" },
  { src: "/brand/about-cargo.jpg", title: "Hızlı Kargo", sub: "Güvenli Paketleme · Hızlı Teslimat" },
] as const;


export function CorporatePageView() {
  return (
    <ShopChrome mainClassName="pt-6 pb-0">
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">Ana Sayfa</Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Kurumsal</span>
      </nav>

      {/* HERO */}
      <section className="mb-10 grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(340px,1fr)_minmax(0,0.7fr)] xl:gap-7">
        <div className="pt-1">
          <h1 className="text-[34px] font-extrabold leading-none tracking-[0.02em] text-navy uppercase sm:text-[38px]">
            Kurumsal
          </h1>
          <span className="mt-3 block h-[4px] w-[38px] rounded-full bg-orange" />
          <h2 className="mt-5 text-[17px] font-extrabold leading-snug text-navy sm:text-[19px]">
            Markanıza değer katan yaratıcı promosyon çözümleri.
          </h2>
          <p className="mt-4 max-w-[480px] text-[13.5px] leading-[1.75] text-[#3c4452]">
            2007 yılından bu yana promosyon ürünleri, kurumsal hediyelikler ve baskılı reklam ürünlerinde kaliteli,
            hızlı ve güvenilir çözümler sunuyoruz.
          </p>
          <p className="mt-3 max-w-[490px] text-[13.5px] leading-[1.75] text-[#3c4452]">
            Geniş ürün yelpazemiz, güçlü üretim altyapımız ve müşteri odaklı yaklaşımımızla markaların değerini
            yükseltiyor, ihtiyaçlarınıza özel çözümler üretiyoruz.
          </p>
        </div>

        <div className="about-blob mx-auto w-full max-w-[520px] xl:max-w-none">
          <div className="about-blob-inner relative w-full">
            <Image
              src="/brand/about-building-ref.png"
              alt="Eser Promo"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1280px) 90vw, 480px"
            />
          </div>
        </div>

        <aside className="rounded-xl border border-[#eceff3] bg-white px-5 py-5">
          <h3 className="text-[15px] font-extrabold tracking-wide text-navy uppercase">
            Neden Eser Promosyon?
          </h3>
          <ul className="mt-4 space-y-4">
            {WHY_US.map(({ title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-orange" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-extrabold leading-tight text-navy">{title}</p>
                  <p className="mt-1 text-[12px] leading-snug text-[#6b7280]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* YOLCULUĞUMUZ */}
      <section className="rounded-xl bg-[#f4f6f8] px-5 py-6 sm:px-7">
        <div className="grid items-center gap-6 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,180px)]">
          <div>
            <h2 className="text-[16px] font-extrabold tracking-wide text-navy uppercase">Yolculuğumuz</h2>
            <p className="mt-2 text-[12px] leading-[1.7] text-[#4b5563]">
              Küçük bir atölyede başlayan yolculuğumuz, bugün modern üretim altyapımız ve uzman ekibimizle her geçen gün büyüyor.
            </p>
          </div>

          <div className="flex items-start justify-between gap-2 overflow-x-auto py-2 xl:gap-0">
            {JOURNEY.map((item) => (
              <div key={item.year} className="flex flex-col items-center text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-orange text-[11px] font-extrabold text-white sm:size-11">
                  {item.year}
                </div>
                <div className="mt-1 h-4 w-px bg-orange/40" />
                <p className="mt-1 whitespace-pre-line text-[10.5px] leading-tight text-[#4b5563] sm:text-[11px]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-[#0b9d58] px-4 py-4 text-white">
            <p className="text-[24px] font-extrabold leading-none">10.000+</p>
            <p className="mt-1 text-[12px] font-semibold">Mutlu Müşteri</p>
            <div className="my-3 h-px bg-white/25" />
            <p className="text-[24px] font-extrabold leading-none">5.000+</p>
            <p className="mt-1 text-[12px] font-semibold">Ürün Çeşidi</p>
          </div>
        </div>
      </section>

      {/* DEĞERLER */}
      <section className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-3 xl:grid-cols-5 xl:divide-x xl:divide-[#e5e7eb]">
        {VALUES.map(({ Icon, title, text }) => (
          <article key={title} className="flex flex-col items-center px-4 py-2 text-center sm:px-5">
            <Icon className="size-9 shrink-0 text-orange" strokeWidth={1.4} />
            <h3 className="mt-3 text-[13.5px] font-extrabold leading-tight text-navy">{title}</h3>
            <p className="mt-1.5 max-w-[200px] text-[11.5px] leading-snug text-[#6b7280]">{text}</p>
          </article>
        ))}
      </section>

      {/* ÜRETİM GÜCÜMÜZ */}
      <section className="mt-10">
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="flex flex-col justify-between rounded-xl bg-navy px-5 py-6 text-white">
            <div>
              <h2 className="text-[16px] font-extrabold tracking-wide uppercase">Üretim Gücümüz</h2>
              <p className="mt-3 text-[12.5px] leading-[1.7] text-white/80">
                Gelişmiş makine parkurumuz ve deneyimli ekibimizle promosyon ürünlerinden baskılı reklama, kurumsal
                hediyeliklerden özel tasarım ürünlere kadar geniş bir yelpazede hizmet veriyoruz.
              </p>
            </div>
            <Link
              href="/baski-teknikleri"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 self-start rounded-md border border-white/30 px-5 text-[12px] font-extrabold tracking-wide text-white hover:bg-white/10"
            >
              ÜRETİM ALTYAPIMIZ
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {SERVICES.map((item) => (
              <figure key={item.title} className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
                <div className="relative aspect-[1.15/1] overflow-hidden">
                  <Image src={item.src} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 45vw, 200px" />
                </div>
                <figcaption className="border-t border-[#eef1f4] bg-[#f7f8fa] px-2 py-2 text-center">
                  <p className="text-[11.5px] font-extrabold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-[#8b919a]">{item.sub}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10 mb-4" />
    </ShopChrome>
  );
}
