import { SITE_CONTACT } from "./catalog-page";
import { LOCAL_AREA_LINKS } from "@/lib/seo/local-areas";

export type InfoSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type InfoPageContent = {
  title: string;
  intro: string;
  sections: InfoSection[];
};

export const FOOTER_COLS = {
  kurumsal: [
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/kurumsal", label: "Kurumsal" },
    { href: "/baski-teknikleri", label: "Baskı Teknikleri" },
    { href: "/teklif", label: "Toplu Alım / Teklif" },
    { href: "/logolu-siparis", label: "Logolu Sipariş" },
    ...LOCAL_AREA_LINKS.slice(0, 3),
    { href: "/bayilik", label: "Bayilik" },
    { href: "/kariyer", label: "Kariyer" },
    { href: "/iletisim", label: "İletişim" },
  ],
  hizmetler: [
    { href: "/sss", label: "Sıkça Sorulan Sorular" },
    { href: "/kargo-teslimat", label: "Kargo & Teslimat" },
    { href: "/iade-degisim", label: "İade & Değişim" },
    { href: "/gizlilik", label: "Gizlilik Politikası" },
  ],
  bilgilendirme: [
    { href: "/kullanim-sartlari", label: "Kullanım Şartları" },
    { href: "/odeme-yontemleri", label: "Ödeme Yöntemleri" },
    { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
    { href: "/site-haritasi", label: "Site Haritası" },
  ],
} as const;

export const INFO_PAGES: Record<string, InfoPageContent> = {
  hakkimizda: {
    title: "Hakkımızda",
    intro:
      "Eser Promo, kurumsal hediye ve promosyon ürünlerinde hızlı, kaliteli ve logolu üretim sunar. Tuzla / İstanbul’daki ekibimizle siparişten teslimata kadar sürecin yanınızdayız.",
    sections: [
      {
        heading: "Ne yapıyoruz?",
        paragraphs: [
          "Ajanda, kalem, tekstil, termos, çanta ve teknoloji ürünleri başta olmak üzere geniş bir promosyon kataloğu sunuyoruz. Ürünlerinize logo, isim veya kurumsal kimliğinizi baskı teknikleriyle uyguluyoruz.",
        ],
        bullets: [
          "Kurumsal hediye ve toplu sipariş",
          "Logolu üretim ve numune çalışması",
          "Hızlı tedarik ve teslimat",
          "Kurumlara özel teklif hazırlığı",
        ],
      },
      {
        heading: "Neden Eser Promo?",
        paragraphs: [
          "Doğru ürünü, doğru adette ve istenen baskı kalitesiyle teslim etmeyi hedefliyoruz. Hem tekil alışveriş hem de kurumsal toplu alımlar için aynı titizlikle çalışırız.",
        ],
      },
      {
        heading: "Bize ulaşın",
        paragraphs: [
          `${SITE_CONTACT.address} adresindeki ofisimizden veya ${SITE_CONTACT.phone} / ${SITE_CONTACT.email} üzerinden bize ulaşabilirsiniz.`,
        ],
      },
    ],
  },
  bayilik: {
    title: "Bayilik",
    intro:
      "Eser Promo bayilik sistemiyle bölgenizde promosyon ürünleri satışı yapmak, kurumsal müşterilerinize logolu çözümler sunmak istiyorsanız sizinle çalışmak isteriz.",
    sections: [
      {
        heading: "Kimler başvurabilir?",
        paragraphs: [
          "Reklam, matbaa, kurumsal hediye veya ofis ürünleri alanında faaliyet gösteren firmalar ile yeni bir satış kanalı açmak isteyen girişimciler başvurabilir.",
        ],
      },
      {
        heading: "Bayilikte neler sunuyoruz?",
        bullets: [
          "Geniş ürün kataloğu ve güncel stok bilgisi",
          "Logolu üretim ve teknik destek",
          "Kurumsal teklif hazırlama desteği",
          "Satış sonrası sipariş takibi",
        ],
      },
      {
        heading: "Başvuru",
        paragraphs: [
          `Bayilik talebinizi ${SITE_CONTACT.email} adresine veya WhatsApp hattımız ${SITE_CONTACT.whatsapp} üzerinden iletin. Firma unvanı, faaliyet bölgeniz ve kısaca deneyiminizi yazmanız yeterlidir. En kısa sürede dönüş yaparız.`,
        ],
      },
    ],
  },
  kariyer: {
    title: "Kariyer",
    intro:
      "Satış, operasyon, grafik ve müşteri hizmetleri ekiplerimize katılmak isterseniz açık pozisyonlarımızı ve başvuru bilgilerini bu sayfada paylaşırız.",
    sections: [
      {
        heading: "Nasıl başvurulur?",
        paragraphs: [
          `Özgeçmişinizi ${SITE_CONTACT.email} adresine “Kariyer – Ad Soyad” konu başlığıyla gönderin. Başvurunuz ilgili birim tarafından incelenir; uygun görülmesi halinde sizinle iletişime geçeriz.`,
        ],
      },
      {
        heading: "Aradığımız yetkinlikler",
        bullets: [
          "Müşteri odaklı iletişim",
          "Düzenli ve hızlı iş takibi",
          "Promosyon, e-ticaret veya baskı süreçlerine ilgi",
          "Takım içinde net ve çözüm odaklı çalışma",
        ],
      },
      {
        heading: "Açık pozisyonlar",
        paragraphs: [
          "Şu anda ilan edilen sabit bir pozisyon bulunmuyorsa bile nitelikli başvuruları arşivleriz. Uygun bir açılış olduğunda sizinle iletişime geçebiliriz.",
        ],
      },
    ],
  },
  iletisim: {
    title: "İletişim",
    intro: "Sipariş, teklif, baskı ve teslimat sorularınız için bize aşağıdaki kanallardan ulaşabilirsiniz.",
    sections: [
      {
        heading: "Adres",
        paragraphs: [SITE_CONTACT.address],
      },
      {
        heading: "Telefon",
        paragraphs: [`Müşteri hattı: ${SITE_CONTACT.phone}`],
      },
      {
        heading: "WhatsApp",
        paragraphs: [`Hızlı destek: ${SITE_CONTACT.whatsapp}`],
      },
      {
        heading: "E-posta",
        paragraphs: [SITE_CONTACT.email],
      },
      {
        heading: "Çalışma",
        paragraphs: [
          "Mesajlarınıza mesai saatleri içinde dönüş yapılır. Acil sipariş ve baskı soruları için WhatsApp hattını kullanmanızı öneririz.",
        ],
      },
    ],
  },
  sss: {
    title: "Sıkça Sorulan Sorular",
    intro: "Sipariş, baskı, kargo ve iade süreçleriyle ilgili en çok sorulan başlıklar.",
    sections: [
      {
        heading: "Nasıl sipariş verebilirim?",
        paragraphs: [
          "Ürünü sepete ekleyip teslimat ve ödeme adımlarını tamamlayarak sipariş verebilirsiniz. Üye olmadan da alışveriş yapılabilir; hesap oluşturursanız siparişlerinizi Hesabım üzerinden takip edersiniz.",
        ],
      },
      {
        heading: "Logolu / baskılı sipariş nasıl işler?",
        paragraphs: [
          "Logolu üretim için ürün, adet, renk ve baskı yerini belirtmeniz gerekir. Logo dosyanızı (tercihen vektör: AI, PDF, EPS) teklif veya sipariş notuyla iletin. Onayınız alındıktan sonra üretime geçilir.",
        ],
      },
      {
        heading: "Minimum sipariş adedi var mı?",
        paragraphs: [
          "Standart stok ürünlerde adet ürün sayfasındaki stok ve satış birimine göre değişir. Logolu üretimlerde ürün ve baskı tekniğine göre asgari adet uygulanabilir; net bilgi için teklif alın.",
        ],
      },
      {
        heading: "Kargo ücreti ne kadar?",
        paragraphs: [
          "750 TL ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde kargo bedeli ödeme adımında gösterilir. Aynı gün kargo, stok durumuna ve sipariş saatine bağlıdır.",
        ],
      },
      {
        heading: "Ödeme seçenekleri neler?",
        paragraphs: [
          "Kredi kartı (iyzico / 3D Secure) ve havale/EFT ile ödeme alıyoruz. Visa, Mastercard ve Troy kartlar kullanılabilir.",
        ],
      },
      {
        heading: "Siparişimi nasıl takip ederim?",
        paragraphs: [
          "Üye girişi yaptıktan sonra Hesabım > Siparişlerim ekranından durumunu görebilirsiniz. Kargoya verilen siparişlerde takip bilgisi e-posta veya hesap özetinde paylaşılır.",
        ],
      },
    ],
  },
  "kargo-teslimat": {
    title: "Kargo & Teslimat",
    intro: "Siparişleriniz stok ve üretim durumuna göre kargoya verilir. Teslimat Türkiye genelinde anlaşmalı kargo firmalarıyla yapılır.",
    sections: [
      {
        heading: "Ücretsiz kargo",
        paragraphs: [
          "750 TL ve üzeri siparişlerde kargo ücretsizdir. Kampanya ve kargo eşiği ürün veya dönem bazında değişebilir; güncel tutar sepet ve ödeme ekranında görünür.",
        ],
      },
      {
        heading: "Süreler",
        bullets: [
          "Stoktaki, baskısız ürünler: uygun siparişlerde aynı gün kargoya verilmeye çalışılır.",
          "Logolu / özel üretim: tasarım onayı sonrası üretim süresine bağlıdır; teslim tarihi teklifte belirtilir.",
          "Kargo süresi, teslimat ilçesine göre genellikle 1–3 iş günüdür.",
        ],
      },
      {
        heading: "Teslimat adresi",
        paragraphs: [
          "Siparişi verdiğiniz adrese teslim edilir. Adres, telefon ve fatura bilgilerinin doğru olduğundan emin olun. Teslim alınamayan gönderiler kargo şubesinde bekletilir; süre sonunda iade edilebilir.",
        ],
      },
      {
        heading: "Ofisten teslim",
        paragraphs: [
          `İsterseniz siparişinizi ${SITE_CONTACT.address} adresinden teslim alabilirsiniz. Bu seçenek ödeme adımında sunulur.`,
        ],
      },
    ],
  },
  "iade-degisim": {
    title: "İade & Değişim",
    intro:
      "Tüketici mevzuatı çerçevesinde cayma ve iade haklarınız saklıdır. Logolu ve kişiye özel üretilen ürünlerde iade kuralları farklıdır.",
    sections: [
      {
        heading: "Cayma hakkı",
        paragraphs: [
          "Mesafeli satışlarda, standart (baskısız, kişiye özel olmayan) ürünlerde teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Ürün kullanılmamış, etiketli ve tekrar satılabilir durumda olmalıdır.",
        ],
      },
      {
        heading: "Logolu ve özel üretim",
        paragraphs: [
          "Logolu, isimli veya talebinize göre üretilen ürünler kişiye özel mal kapsamındadır. Bu ürünlerde cayma / iade hakkı, yasal istisna nedeniyle kural olarak uygulanmaz. Hatalı baskı veya üretim hatası varsa değiştirme veya yeniden üretim yapılır.",
        ],
      },
      {
        heading: "Nasıl talep açılır?",
        paragraphs: [
          `Hesabım > İade & Değişim Taleplerim üzerinden veya ${SITE_CONTACT.email} / ${SITE_CONTACT.whatsapp} kanallarından sipariş numaranızla başvurun. Onaylanan iadelerde kargo yönlendirmesi tarafımızca iletilir.`,
        ],
      },
      {
        heading: "İade edilmeyen durumlar",
        bullets: [
          "Hijyen nedeniyle iade edilemeyen kişisel kullanım ürünleri",
          "Müşteri kaynaklı hasar, eksik parça veya kullanılmış ürün",
          "Onaysız logolu / özel üretim siparişler (üretim hatası hariç)",
        ],
      },
    ],
  },
  gizlilik: {
    title: "Gizlilik Politikası",
    intro:
      "Eser Promo olarak sitemizi ziyaretiniz ve alışverişiniz sırasında elde edilen bilgileri 6698 sayılı KVKK ve ilgili mevzuata uygun işleriz.",
    sections: [
      {
        heading: "Toplanan veriler",
        paragraphs: [
          "Üyelik, sipariş, teklif ve iletişim formlarında ad, soyad, e-posta, telefon, teslimat/fatura adresi, ödeme işlemi için gerekli bilgiler ve site kullanımına ilişkin teknik veriler (çerez, IP, oturum) işlenebilir.",
        ],
      },
      {
        heading: "Kullanım amaçları",
        bullets: [
          "Siparişin oluşturulması, tahsilatı ve teslimatı",
          "Üyelik hesabının yönetimi ve güvenlik",
          "Müşteri destek taleplerinin yanıtlanması",
          "Yasal yükümlülüklerin yerine getirilmesi",
          "İzniniz varsa kampanya ve e-bülten bilgilendirmesi",
        ],
      },
      {
        heading: "Çerezler",
        paragraphs: [
          "Oturum, sepet ve güvenlik için zorunlu çerezler kullanılır. Performans ve tercih çerezleri deneyimi iyileştirmek içindir. Tarayıcı ayarlarından çerezleri sınırlayabilirsiniz; bu durumda bazı işlevler çalışmayabilir.",
        ],
      },
      {
        heading: "Paylaşım",
        paragraphs: [
          "Veriler; kargo firmaları, ödeme altyapısı (iyzico), barındırma ve yasal merciler gibi hizmetin gerektirdiği taraflarla, amaçla sınırlı paylaşılabilir. Verileriniz izniniz olmadan üçüncü kişilere satılmaz.",
        ],
      },
      {
        heading: "Haklarınız",
        paragraphs: [
          `KVKK kapsamındaki haklarınız için ${SITE_CONTACT.email} adresine başvurabilirsiniz. Ayrıntılar KVKK Aydınlatma Metni sayfasındadır.`,
        ],
      },
    ],
  },
  "kullanim-sartlari": {
    title: "Kullanım Şartları",
    intro:
      "eserpromo.com sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Site içeriği, fiyat ve stok bilgileri önceden haber verilmeksizin güncellenebilir.",
    sections: [
      {
        heading: "Hizmetin kapsamı",
        paragraphs: [
          "Site üzerinden promosyon ürünlerinin incelenmesi, sepete eklenmesi, sipariş ve üyelik işlemleri sunulur. Logolu üretim, numune ve toplu alım teklifleri ayrıca teyit edilebilir.",
        ],
      },
      {
        heading: "Üyelik ve sipariş",
        bullets: [
          "Verdiğiniz bilgilerin doğru ve güncel olması sizin sorumluluğunuzdadır.",
          "Fiyat, KDV ve kargo tutarı ödeme önizlemesinde gösterilen değerlerdir.",
          "Stok tükenmesi veya teknik hata halinde sipariş iptal edilip ücret iadesi yapılabilir.",
          "Logolu işlerde üretim, onaylanan görsele göre başlar.",
        ],
      },
      {
        heading: "Fikri haklar",
        paragraphs: [
          "Sitedeki marka, metin, görsel ve katalog bilgileri Eser Promo’ya veya lisans verenlere aittir. İzinsiz kopyalanamaz. Müşteri logo ve tasarımlarının kullanım hakkı müşteriye aittir; üretim yalnızca sipariş kapsamında yapılır.",
        ],
      },
      {
        heading: "Sorumluluk",
        paragraphs: [
          "Site kesintisiz ve hatasız çalışacağı garanti edilmez. Kargo sürecindeki gecikmeler anlaşmalı firmanın operasyonuna bağlı olabilir. Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku ve İstanbul mahkemeleri yetkilidir.",
        ],
      },
    ],
  },
  "odeme-yontemleri": {
    title: "Ödeme Yöntemleri",
    intro: "Siparişlerinizde kredi kartı veya havale/EFT kullanabilirsiniz. Ödeme altyapımız 256 bit SSL ile korunur.",
    sections: [
      {
        heading: "Kredi kartı",
        paragraphs: [
          "Visa, Mastercard ve Troy kartlar iyzico altyapısıyla 3D Secure doğrulaması üzerinden tahsil edilir. Kart bilgileriniz sitemizde saklanmaz; işlem ödeme kuruluşunun güvenli sayfasında tamamlanır.",
        ],
      },
      {
        heading: "Havale / EFT",
        paragraphs: [
          "Havale seçeneğinde sipariş onayından sonra hesap bilgileri iletilir. Ödemeniz hesabımıza yansıdıktan sonra sipariş hazırlığa alınır. Dekontu e-posta veya WhatsApp ile göndermeniz süreci hızlandırır.",
        ],
      },
      {
        heading: "Güvenlik",
        bullets: [
          "256 bit SSL şifreleme",
          "3D Secure doğrulama",
          "iyzico ödeme altyapısı",
        ],
      },
      {
        heading: "Fatura",
        paragraphs: [
          "Bireysel veya kurumsal fatura kesilebilir. Kurumsal fatura için unvan, vergi dairesi ve vergi numarası ödeme adımında istenir.",
        ],
      },
    ],
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    intro:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu md. 10 uyarınca, veri sorumlusu sıfatıyla Eser Promo tarafından kişisel verilerinizin işlenmesine ilişkin bilgilendirme aşağıdadır.",
    sections: [
      {
        heading: "Veri sorumlusu",
        paragraphs: [
          `Eser Promo — ${SITE_CONTACT.address}`,
          `E-posta: ${SITE_CONTACT.email} · Telefon: ${SITE_CONTACT.phone}`,
        ],
      },
      {
        heading: "İşlenen kişisel veriler",
        paragraphs: [
          "Kimlik (ad, soyad), iletişim (telefon, e-posta, adres), müşteri işlem (sipariş, fatura, ödeme durumu), işlem güvenliği (IP, çerez, oturum) ve pazarlama (e-bülten izni varsa) kategorilerindeki veriler işlenebilir.",
        ],
      },
      {
        heading: "Amaç ve hukuki sebep",
        bullets: [
          "Sözleşmenin kurulması ve ifası (sipariş, teslimat, üyelik)",
          "Hukuki yükümlülük (fatura, muhasebe, tüketici işlemleri)",
          "Meşru menfaat (bilgi güvenliği, dolandırıcılığın önlenmesi)",
          "Açık rıza (ticari elektronik ileti, e-bülten)",
        ],
      },
      {
        heading: "Aktarım",
        paragraphs: [
          "Veriler; kargo, ödeme kuruluşu, barındırma, muhasebe ve yasal zorunluluk halinde yetkili kamu kurumlarıyla paylaşılabilir. Yurt dışına aktarım söz konusu olursa KVKK’daki usullere uyulur.",
        ],
      },
      {
        heading: "Saklama süresi",
        paragraphs: [
          "Veriler, işleme amacının gerektirdiği süre ve yasal zamanaşımı / saklama yükümlülükleri boyunca tutulur; süre bitiminde silinir, yok edilir veya anonim hale getirilir.",
        ],
      },
      {
        heading: "Haklarınız (KVKK md. 11)",
        paragraphs: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, düzeltilmesini ve silinmesini isteme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.",
        ],
      },
      {
        heading: "Başvuru",
        paragraphs: [
          `Taleplerinizi ${SITE_CONTACT.email} adresine kimliğinizi tespit edilebilir şekilde iletebilirsiniz. Başvurular yasal süre içinde yanıtlanır.`,
        ],
      },
    ],
  },
};

export const SHOP_SITEMAP = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Tüm Ürünler" },
  { href: "/bolgeler/tuzla-promosyon-urunleri", label: "Tuzla Promosyon Ürünleri" },
  { href: "/bolgeler/pendik-promosyon-urunleri", label: "Pendik Promosyon Ürünleri" },
  { href: "/bolgeler/gebze-promosyon-urunleri", label: "Gebze Promosyon Ürünleri" },
  { href: "/teklif", label: "Toplu Alım / Teklif" },
  { href: "/sepet", label: "Sepetim" },
  { href: "/favoriler", label: "Favorilerim" },
  { href: "/giris", label: "Giriş Yap" },
  { href: "/kayit", label: "Üye Ol" },
  { href: "/hesabim", label: "Hesabım" },
] as const;
