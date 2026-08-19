export type LocalArea = {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  intro: string;
  highlights: string[];
  nearby: string[];
};

export const LOCAL_AREAS: LocalArea[] = [
  {
    slug: "tuzla-promosyon-urunleri",
    name: "Tuzla",
    title: "Tuzla Promosyon Ürünleri",
    metaDescription:
      "Tuzla ve çevresine logolu promosyon ürünleri, kurumsal hediyelik ve toplu alım. Eser Promo Tuzla merkezli üretim, hızlı numune ve teslimat.",
    intro:
      "Eser Promo, Tuzla / Aydıntepe merkezli promosyon ve kurumsal hediye tedarikçisidir. Organize sanayi bölgeleri, ofisler ve etkinlikler için kalem, ajanda, tekstil, termos ve teknoloji ürünlerinde logolu baskı çözümleri sunuyoruz.",
    highlights: [
      "Tuzla ve yakın ilçelere hızlı teslimat",
      "Logolu baskı, numune ve toplu alım teklifi",
      "Kurumsal siparişlerde fiyat ve stok desteği",
      "WhatsApp ve telefon ile aynı gün geri dönüş",
    ],
    nearby: ["Pendik", "Gebze", "Kartal", "Dilovası"],
  },
  {
    slug: "pendik-promosyon-urunleri",
    name: "Pendik",
    title: "Pendik Promosyon Ürünleri",
    metaDescription:
      "Pendik firmalarına promosyon ürünleri, kurumsal hediyelik ve logolu baskı. Tuzla'dan Pendik'e hızlı tedarik ve toplu alım teklifi.",
    intro:
      "Pendik'teki işletmeler, fuar katılımları ve kurumsal etkinlikler için geniş promosyon ürünü kataloğumuzdan yararlanabilir. Tuzla'daki merkezimizden Pendik'e düzenli sevkiyat yapıyoruz.",
    highlights: [
      "Pendik ve çevresine promosyon sevkiyatı",
      "UV baskı, tampon baskı ve lazer seçenekleri",
      "Toplu alım / kurumsal teklif formu",
      "Stoklu ürünlerde hızlı termin",
    ],
    nearby: ["Tuzla", "Kartal", "Tuzla OSB", "Sultanbeyli"],
  },
  {
    slug: "gebze-promosyon-urunleri",
    name: "Gebze",
    title: "Gebze Promosyon Ürünleri",
    metaDescription:
      "Gebze ve Kocaeli sanayi bölgesine promosyon ürünleri, logolu hediyelik ve kurumsal tedarik. Eser Promo ile toplu alım teklifi alın.",
    intro:
      "Gebze, Çayırova ve Dilovası başta olmak üzere Kocaeli sanayi hattındaki firmalara promosyon ve kurumsal hediye tedariki sağlıyoruz. Fabrika ziyaretleri, fuarlar ve çalışan hediyeleri için uygundur.",
    highlights: [
      "Gebze ve Kocaeli hattına düzenli teslimat",
      "Sanayi firmalarına toplu alım çözümleri",
      "Logo baskılı üretim ve numune onayı",
      "Teklif ve logolu sipariş formları",
    ],
    nearby: ["Dilovası", "Çayırova", "Tuzla", "Darıca"],
  },
  {
    slug: "kartal-promosyon-urunleri",
    name: "Kartal",
    title: "Kartal Promosyon Ürünleri",
    metaDescription:
      "Kartal ve Anadolu Yakası'na promosyon ürünleri, kurumsal hediyelik ve logolu baskı. Tuzla merkezli Eser Promo'dan teklif alın.",
    intro:
      "Kartal, Maltepe ve Anadolu Yakası'ndaki kurumlar için promosyon ürünleri ve logolu hediyelik tedariki sunuyoruz. Tuzla merkezimizden hızlı lojistik ile ulaşım sağlanır.",
    highlights: [
      "Anadolu Yakası promosyon tedariki",
      "Kurumsal hediye setleri ve kalem-ajanda grupları",
      "Online katalog ve teklif talebi",
      "Baskı teknikleri danışmanlığı",
    ],
    nearby: ["Pendik", "Maltepe", "Tuzla", "Sultanbeyli"],
  },
  {
    slug: "dilovasi-promosyon-urunleri",
    name: "Dilovası",
    title: "Dilovası Promosyon Ürünleri",
    metaDescription:
      "Dilovası ve Gebze hattına promosyon ürünleri, logolu kurumsal hediyelik. Eser Promo Tuzla'dan Kocaeli'ne hızlı tedarik.",
    intro:
      "Dilovası organize sanayi ve çevresindeki üretim tesisleri için promosyon ürünleri, çalışan hediyeleri ve fuar materyalleri tedarik ediyoruz.",
    highlights: [
      "Dilovası–Gebze hattına sevkiyat",
      "Toplu alım ve kurumsal fiyatlandırma",
      "Logolu üretim süreci yönetimi",
      "Telefon ve WhatsApp destek hattı",
    ],
    nearby: ["Gebze", "Çayırova", "Tuzla", "Darıca"],
  },
];

const areaMap = new Map(LOCAL_AREAS.map((area) => [area.slug, area]));

export function getLocalArea(slug: string) {
  return areaMap.get(slug) ?? null;
}

export function localAreaPath(slug: string) {
  return `/bolgeler/${slug}/`;
}

export const LOCAL_AREA_LINKS = LOCAL_AREAS.map((area) => ({
  href: localAreaPath(area.slug),
  label: area.title,
}));

export const LOCAL_SERVICE_AREAS = LOCAL_AREAS.map((area) => area.name);
