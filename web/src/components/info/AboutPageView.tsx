import Image from "next/image";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import {
  BadgeCheck,
  Clock,
  Eye,
  Gift,
  Headset,
  Home,
  Package,
  ShieldCheck,
  PencilLine,
  Tags,
  Target,
  Truck,
  Users,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";

const signatureFont = Dancing_Script({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const STATS = [
  { Icon: BadgeCheck, title: "17+", label: "Yıllık Tecrübe" },
  { Icon: Users, title: "10.000+", label: "Mutlu Müşteri" },
  { Icon: Package, title: "5.000+", label: "Ürün Çeşidi" },
  { Icon: Truck, title: "Hızlı", label: "Teslimat" },
  { Icon: Headset, title: "7/24", label: "Destek" },
  { Icon: ShieldCheck, title: "%100", label: "Müşteri Memnuniyeti" },
] as const;

const VALUES = [
  {
    Icon: Target,
    title: "Müşteri Odaklı",
    text: "İhtiyaçlarınızı dinler, en uygun çözümleri sizin için üretiriz.",
  },
  {
    Icon: BadgeCheck,
    title: "Kalite Garantisi",
    text: "Tüm ürün ve hizmetlerimizde kaliteden ödün vermeyiz.",
  },
  {
    Icon: Tags,
    title: "Uygun Fiyat",
    text: "Bütçenize uygun, rekabetçi fiyat avantajı sağlarız.",
  },
  {
    Icon: Clock,
    title: "Zamanında Teslimat",
    text: "Söz verdiğimiz zamanda ürünlerinizi teslim ederiz.",
  },
  {
    Icon: PencilLine,
    title: "Özel Tasarım Desteği",
    text: "Markanıza özel tasarım ve baskı desteği ile fark yaratırız.",
  },
] as const;

const SERVICES = [
  { src: "/brand/about-print.jpg", title: "Baskı Çözümleri" },
  { src: "/brand/about-laser.jpg", title: "Özel Tasarım" },
  { src: "/brand/about-gifts.jpg", title: "Kurumsal Hediyelik" },
  { src: "/brand/about-cargo.jpg", title: "Hızlı Kargo" },
] as const;

export function AboutPageView() {
  return (
    <ShopChrome mainClassName="pt-6 pb-0">
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Hakkımızda</span>
      </nav>

      <section className="mb-12 grid items-start gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1fr)_220px] xl:gap-8">
        <div className="pt-1">
          <h1 className="text-[36px] font-extrabold leading-none tracking-[0.02em] text-navy uppercase">Hakkımızda</h1>
          <span className="mt-3 block h-[4px] w-[38px] rounded-full bg-orange" />
          <h2 className="mt-7 text-[24px] font-extrabold leading-tight text-navy">Markanızı değerli kılan, biziz.</h2>
          <p className="mt-5 max-w-[510px] text-[14px] leading-[1.72] text-[#3c4452]">
            2007 yılından bu yana promosyon ürünleri, kurumsal hediyelikler ve baskılı reklam ürünlerinde kaliteli,
            hızlı ve güvenilir çözümler sunuyoruz.
          </p>
          <p className="mt-4 max-w-[535px] text-[14px] leading-[1.72] text-[#3c4452]">
            Geniş ürün yelpazemiz, deneyimli ekibimiz ve müşteri odaklı hizmet anlayışımızla markaların değerini
            yükseltiyor; ihtiyaçlarınıza özel çözümler üretiyoruz.
          </p>
          <p className={`${signatureFont.className} mt-10 text-[31px] leading-tight text-navy`}>
            Çözüm Ortağınız, Değer Katan Hizmetimiz.
          </p>
          <span className="about-signature-line" aria-hidden />
        </div>

        <div className="about-blob mx-auto w-full max-w-[520px] xl:max-w-none">
          <div className="about-blob-inner relative w-full">
            <Image
              src="/brand/about-building-ref.png"
              alt="Eser Promo binası"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1280px) 90vw, 560px"
            />
          </div>
        </div>

        <ul className="about-stats-card xl:mt-1">
          {STATS.map(({ Icon, title, label }, index) => (
            <li key={title} className={index > 0 ? "about-stats-item" : undefined}>
              <div className="flex items-center gap-4 px-5 py-[18px]">
                <Icon className="size-7 shrink-0 text-orange" strokeWidth={1.35} />
                <div className="min-w-0">
                  <p className="text-[20px] font-extrabold leading-none text-navy">{title}</p>
                  <p className="mt-1.5 text-[13px] leading-none text-navy">{label}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-xl bg-[#f4f6f8] px-5 py-7 sm:px-7">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5 xl:gap-5">
          {VALUES.map(({ Icon, title, text }) => (
            <article key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-9 shrink-0 text-orange" strokeWidth={1.4} />
              <div className="min-w-0">
                <h3 className="text-[14px] font-extrabold leading-tight text-navy">{title}</h3>
                <p className="mt-1.5 text-[12px] leading-snug text-navy/80">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="grid items-start gap-4 xl:grid-cols-[1.04fr_1.36fr_0.9fr]">
          <div className="rounded-xl border border-[#eceff3] bg-white p-5">
            <h2 className="text-[16px] font-extrabold leading-tight text-navy">Genç, Dinamik ve Uzman Kadro</h2>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#4b5563]">
              Alanında uzman, dinamik ve yaratıcı ekibimizle; siparişinizin her aşamasını yanınızdayız. Teknolojiyi
              yakından takip ederek, modern üretim teknikleri ve kaliteli malzemelerle en iyi sonucu elde ediyoruz.
            </p>
            <p className="mt-4 text-[12px] leading-[1.7] text-[#4b5563]">
              Amacımız; uzun vadeli iş ortaklıkları kurarak karşılıklı güvene dayalı, sürdürülebilir ilişkiler
              geliştirmektir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SERVICES.map((item) => (
              <figure key={item.title} className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
                <div className="relative aspect-[1.18/1] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, 180px"
                  />
                </div>
                <figcaption className="border-t border-[#eef1f4] bg-[#f7f8fa] px-2 py-2 text-center text-[11px] font-extrabold text-navy">
                  {item.title}
                </figcaption>
              </figure>
            ))}
          </div>

          <aside className="rounded-xl bg-navy px-5 py-5 text-white">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-navy">
                <Target className="size-5" strokeWidth={1.6} />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold">Misyonumuz</h3>
                <p className="mt-1.5 text-[12px] leading-[1.65] text-white/80">
                  Müşterilerimizin marka değerini artıracak, kaliteli ve yenilikçi promosyon çözümleri sunarak uzun
                  vadeli iş ortaklıkları kurmak.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-navy">
                <Eye className="size-5" strokeWidth={1.6} />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold">Vizyonumuz</h3>
                <p className="mt-1.5 text-[12px] leading-[1.65] text-white/80">
                  Promosyon sektöründe güvenilir, yenilikçi ve öncü bir marka olarak büyümeye devam etmek.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-4 rounded-xl border border-[#eceff3] bg-[#f7f8fa] px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-navy text-white">
                <Gift className="size-7" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-[16px] font-extrabold leading-tight text-navy">
                  Markanızın değerini artıran ürünlerle tanışın!
                </p>
                <p className="mt-1 text-[12px] leading-tight text-[#6b7280]">
                  Binlerce promosyon ve kurumsal hediyelik ürün seçeneği sizi bekliyor.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-orange px-7 text-[13px] font-extrabold tracking-wide text-white hover:bg-orange-hover"
            >
              ÜRÜNLERİ İNCELE
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </ShopChrome>
  );
}
