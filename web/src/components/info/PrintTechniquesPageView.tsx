import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Diamond,
  FlaskConical,
  Home,
  Layers,
  Leaf,
  ShieldCheck,
  Tag,
  Users,
  ChevronRight,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { SITE_CONTACT } from "@/data/catalog-page";

const VALUES = [
  {
    Icon: Diamond,
    title: "Yüksek Kalite",
    text: "Canlı renkler, net detaylar ve uzun ömürlü baskılar.",
  },
  {
    Icon: Layers,
    title: "Geniş Malzeme Uyumu",
    text: "Plastik, metal, cam, ahşap, deri ve daha fazlası.",
  },
  {
    Icon: Users,
    title: "Uzman Kadro",
    text: "Deneyimli ekibimizle profesyonel çözümler.",
  },
  {
    Icon: ShieldCheck,
    title: "Hızlı ve Güvenilir",
    text: "Zamanında üretim, kesintisiz destek.",
  },
  {
    Icon: Leaf,
    title: "Çevre Dostu",
    text: "Doğa dostu mürekkepler ve geri dönüşümlü malzemeler.",
  },
] as const;

const TECHNIQUES = [
  {
    id: "uv",
    title: "UV BASKI",
    color: "#7d53de",
    image: "/brand/print-uv-6090.jpg",
    imageAlt: "6090 UV baskı makinesi",
    intro:
      "UV baskı, özel UV mürekkebin ultraviyole ışınlarla anında kürlendiği modern bir teknolojidir. Düz ve pürüzlü yüzeylerde yüksek yapışma, canlı renk ve kalıcı sonuç sağlar.",
    points: [
      "Renkler solmaya karşı dayanıklıdır.",
      "Suya, çizilmeye ve kimyasallara karşı dirençlidir.",
      "İç ve dış mekan kullanımına uygundur.",
      "Beyaz mürekkep ile yüksek kapatıcılık sağlar.",
      "Kabartma ve dokulu yüzeylere baskı yapılabilir.",
    ],
    uses: [
      "Promosyon ürünleri",
      "Plastik, pleksi, metal yüzeyler",
      "Cam, seramik, ahşap",
      "Tabela ve yönlendirme levhaları",
      "Tekstil ve deri ürünleri",
      "Dekoratif ve mimari uygulamalar",
    ],
  },
  {
    id: "laser",
    title: "LAZER MARKALAMA",
    color: "#2563eb",
    image: "/brand/print-laser-mopa.jpg",
    imageAlt: "MOPA fiber lazer markalama makinesi",
    intro:
      "Lazer markalama, malzeme yüzeyini lazer ışınıyla kalıcı olarak işaretler. Logo, seri numarası ve barkod uygulamalarında yüksek hassasiyetle net ve silinmez sonuç verir.",
    points: [
      "Kalıcı ve silinmez işaretleme sağlar.",
      "Yüksek hassasiyetle ince detaylar işlenir.",
      "Hızlı üretim ve seri çalışmaya uygundur.",
      "Kimyasal kullanmadan temiz markalama yapar.",
      "Metal ve plastik yüzeylerde net sonuç verir.",
    ],
    uses: [
      "Metal ve plastik etiketler",
      "Endüstriyel parçalar",
      "Promosyon ürünleri",
      "Takı ve aksesuar",
      "Elektronik gövdeler",
      "Kalem ve hediyelik setler",
    ],
  },
  {
    id: "pad",
    title: "TAMPON BASKI",
    color: "#16a34a",
    image: "/brand/print-pad.jpg",
    imageAlt: "Tampon baskı makinesi",
    intro:
      "Tampon baskı, silikon tampon sayesinde düzensiz ve kıvrımlı yüzeylere hassas logo aktarımı sağlar. Kalem, çakmak ve küçük promosyon ürünlerinde sık tercih edilir.",
    points: [
      "Düzensiz ve kıvrımlı yüzeylere baskı yapılır.",
      "Küçük ve detaylı logolarda net sonuç verir.",
      "Çok renkli uygulama mümkündür.",
      "Dayanıklı ve uzun ömürlü baskı sağlar.",
      "Seri üretime uygundur.",
    ],
    uses: [
      "Kalemler",
      "Çakmaklar",
      "USB bellekler",
      "Anahtarlıklar",
      "Promosyon hediyelikler",
      "Küçük plastik parçalar",
    ],
  },
  {
    id: "foil",
    title: "SICAK BASKI (VARAK BASKI)",
    color: "#f37021",
    image: "/brand/print-foil.jpg",
    imageAlt: "Sıcak varak baskı örneği",
    intro:
      "Sıcak baskı (varak), ısı ve basınçla altın, gümüş veya renkli folyoyu yüzeye aktarır. Deri, organizer ve kurumsal hediyeliklerde lüks bir görünüm kazandırır.",
    points: [
      "Premium ve lüks görünüm kazandırır.",
      "Altın, gümüş ve renkli varak uygulanır.",
      "Isı ile kalıcı transfer sağlar.",
      "Deri ve kağıtta şık sonuç verir.",
    ],
    uses: [
      "Organizerler",
      "Deri ürünler",
      "Ajanda ve defterler",
      "Kartvizitler",
      "Kutular ve ambalajlar",
      "Kurumsal hediyelikler",
    ],
  },
] as const;

export function PrintTechniquesPageView() {
  return (
    <ShopChrome mainClassName="pt-6 pb-10">
      <div>
        <nav className="mb-7 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
          <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
            <Home className="size-3.5" />
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/" className="hover:text-navy">
            Ana Sayfa
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/hakkimizda" className="hover:text-navy">
            Hakkımızda
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-[#555]">Baskı Teknikleri</span>
        </nav>

        <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)] lg:gap-6 xl:gap-10">
          <div className="pt-2 lg:pt-6">
            <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[0.01em] text-[#0b1f4d] uppercase sm:text-[38px] xl:text-[42px]">
              Baskı Tekniklerimiz
            </h1>
            <span className="mt-3 block h-[5px] w-[46px] rounded-[1px] bg-[#f37021]" aria-hidden />
            <p className="mt-5 text-[16px] font-extrabold leading-snug text-[#0b1f4d] sm:text-[18px]">
              Doğru teknoloji, kusursuz sonuç.
            </p>
            <p className="mt-4 max-w-[460px] text-[13.5px] leading-[1.8] text-[#4b5563] sm:text-[14.5px]">
              Eser Promosyon olarak, farklı malzeme ve ihtiyaçlara en uygun baskı tekniklerini kullanarak yüksek kaliteli,
              kalıcı ve estetik çözümler üretiyoruz. Modern makine parkurumuz ve uzman ekibimizle her projeye özel en iyi
              baskı yöntemini belirleyerek markanıza değer katıyoruz.
            </p>
          </div>
          <div className="relative w-full lg:-mt-2 lg:justify-self-end">
            <Image
              src="/brand/print-hero-uv.webp"
              alt="UV baskı makinesi çalışırken"
              width={1600}
              height={558}
              priority
              className="h-auto w-full"
              sizes="(max-width: 1024px) 94vw, 62vw"
            />
          </div>
        </section>

        <section className="mt-14 grid grid-cols-2 gap-y-8 sm:grid-cols-3 xl:grid-cols-5 xl:gap-0 xl:divide-x xl:divide-[#e5e7eb]">
        {VALUES.map(({ Icon, title, text }) => (
          <article key={title} className="flex flex-col items-center px-4 py-2 text-center sm:px-5">
            <Icon className="size-10 shrink-0 text-orange" strokeWidth={1.45} />
            <h2 className="mt-3 text-[14px] font-extrabold leading-tight text-navy">{title}</h2>
            <p className="mt-2 max-w-[180px] text-[12px] leading-snug text-[#555]">{text}</p>
          </article>
        ))}
      </section>

      <h2 className="mt-10 text-center text-[22px] font-extrabold tracking-[0.04em] text-navy uppercase">
        Baskı Tekniklerimiz
      </h2>

      <div className="mt-5 space-y-4">
        {TECHNIQUES.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-[#eceff3] bg-white px-3 py-4 sm:px-4 sm:py-5"
          >
            <div className="grid items-center gap-x-4 gap-y-4 lg:grid-cols-[minmax(200px,1fr)_minmax(280px,2fr)_minmax(200px,1fr)] lg:gap-x-5 xl:gap-x-6">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-[260px] overflow-hidden rounded-lg bg-white lg:mx-0 lg:max-w-none">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 60vw, 260px"
                />
              </div>

              <div className="min-w-0 px-0 lg:pr-1">
                <h3 className="text-[18px] font-extrabold tracking-wide uppercase sm:text-[20px]" style={{ color: item.color }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.65] text-[#374151]">{item.intro}</p>
                <ul className="mt-3 space-y-2">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-[#374151]">
                      <span
                        className="mt-0.5 grid size-[17px] shrink-0 place-items-center rounded-full text-white"
                        style={{ background: item.color }}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <aside
                className="rounded-lg border border-[#eceff3] bg-white px-4 py-3"
                style={{ borderTopWidth: 4, borderTopColor: item.color, borderLeftWidth: 3, borderLeftColor: item.color }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="size-4 shrink-0" style={{ color: item.color }} />
                  <p className="text-[14px] font-extrabold" style={{ color: item.color }}>
                    Kullanım Alanları
                  </p>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {item.uses.map((use) => (
                    <li key={use} className="flex items-start gap-2 text-[12.5px] leading-snug text-[#374151]">
                      <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.6} style={{ color: item.color }} />
                      {use}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 flex flex-col gap-5 rounded-xl bg-navy px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-lg bg-white/10">
            <FlaskConical className="size-7" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[18px] font-extrabold leading-snug sm:text-[20px]">
              Projenize en uygun baskı tekniğini birlikte belirleyelim!
            </p>
            <p className="mt-1.5 text-[13px] text-white/85">
              Uzman ekibimiz, ihtiyaçlarınıza özel çözümler sunmak için hazır.
            </p>
          </div>
        </div>
        <a
          href={`${SITE_CONTACT.whatsappHref}?text=${encodeURIComponent("Merhaba, baskı tekniği için teklif almak istiyorum.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#f37021] px-6 text-[13px] font-extrabold tracking-wide text-white hover:bg-[#e26518]"
        >
          WHATSAPP&apos;TAN TEKLİF AL
          <WhatsAppIcon className="size-5" />
        </a>
      </section>
      </div>
    </ShopChrome>
  );
}
