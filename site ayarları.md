# Site Ayarları Sayfası – Cursor Geliştirme Dokümanı

## Amaç

`Site Ayarları` ekranı, e-ticaret sitesinin genel ve global davranışlarını yöneten sade bir ayar ekranı olmalıdır.

Bu ekran bir dashboard değildir. KPI kartları, grafikler veya operasyonel tablolar içermemelidir.

Ana amaç:
- Siteye ait genel bilgileri yönetmek
- İletişim bilgilerini yönetmek
- Sipariş davranışlarını belirlemek
- Stok davranışlarını belirlemek
- Firma/fatura bilgilerini yönetmek
- Sosyal medya bağlantılarını yönetmek
- Temel SEO bilgilerini yönetmek
- Bakım modunu yönetmek

---

# 1. Menü Yapısı

Sol menüde mevcut yapı korunmalıdır.

`Site Ayarları` tek bir menü olarak kalmalıdır.

Alt menü oluşturulmasına gerek yoktur.

Sayfa içindeki bölümler kart veya sekme mantığıyla yönetilebilir.

Önerilen yapı:

- Genel Bilgiler
- İletişim Bilgileri
- Sipariş Ayarları
- Stok Ayarları
- Firma / Fatura Bilgileri
- Sosyal Medya
- SEO
- Bakım Modu

---

# 2. Bu Sayfada Olmaması Gereken Alanlar

Aşağıdaki ayarlar başka menülerde zaten bulunduğu için Site Ayarları ekranına tekrar eklenmemelidir.

## Ödeme
`Ödeme Yöntemleri` ekranından yönetilecek.

## Kargo
`Kargo Yönetimi` ekranından yönetilecek.

## E-Posta
`E-Posta Ayarları` ekranından yönetilecek.

## Banner / Slider
`Banner / Slider` ekranından yönetilecek.

## Popup
`Popup Yönetimi` ekranından yönetilecek.

## Kullanıcı / Rol
`Kullanıcılar` ekranından yönetilecek.

## Tema
Renk, font ve benzeri görsel konular `Tema Ayarları` ekranından yönetilecek.

---

# 3. Sayfa Genel Tasarımı

Sayfa mevcut admin panel tasarım diliyle birebir uyumlu olmalıdır.

## Genel UI

- Açık renk ana içerik alanı
- Beyaz ayar kartları
- Hafif border
- Hafif shadow
- 12–16 px border radius
- Bol boşluk
- Karmaşık görünümden kaçınılmalı
- Her ayar bölümü ayrı kart olmalı
- Input yükseklikleri tutarlı olmalı
- Label/input ilişkisi net olmalı
- Toggle kullanılan yerlerde switch component kullanılmalı
- Sayfanın en altında sabit veya belirgin bir `Değişiklikleri Kaydet` butonu olmalı

---

# 4. Sayfa Header

Başlık:

`Site Ayarları`

Alt açıklama:

`Sitenizin genel bilgilerini ve çalışma ayarlarını yönetin.`

Sağ üst aksiyon:

`Değişiklikleri Kaydet`

Opsiyonel ikinci aksiyon:

`Değişiklikleri Sıfırla`

---

# 5. Genel Bilgiler

Kart başlığı:

`Genel Bilgiler`

Alanlar:

### Site Adı
Text input

Örnek:
`Eser Promo`

### Site Başlığı
Text input

Örnek:
`Eser Promosyon Ürünleri`

### Kısa Açıklama
Textarea

Örnek:
`Kurumsal promosyon ürünleri ve özel baskı çözümleri.`

### Logo
Dosya yükleme alanı

- Mevcut logo gösterilmeli
- `Logo Değiştir`
- `Logoyu Kaldır`

Desteklenen formatlar:
- PNG
- JPG
- SVG

### Favicon
Dosya yükleme alanı

Önerilen:
`32x32` veya `64x64`

---

# 6. İletişim Bilgileri

Kart başlığı:

`İletişim Bilgileri`

Alanlar:

### Telefon
Text input

### WhatsApp
Text input

### E-Posta
Email input

### Adres
Textarea

### Google Maps Linki
URL input

Opsiyonel.

---

# 7. Sipariş Ayarları

Kart başlığı:

`Sipariş Ayarları`

Bu bölüm global sipariş davranışlarını yönetmelidir.

## Sipariş Numarası Ön Eki

Text input

Örnek:

`ESR`

Sistem sipariş numaralarını örneğin:

`ESR-2026-001245`

formatında üretebilir.

---

## Minimum Sipariş Tutarı

Decimal / currency input

Örnek:

`500,00 TL`

`0` girilirse minimum sipariş sınırı uygulanmaz.

---

## Sipariş Notu

Switch:

`Aktif / Pasif`

Aktif olduğunda müşteri checkout ekranında sipariş notu girebilir.

Örnek alan:

`Siparişinizle ilgili notunuz`

---

## Stoksuz Ürün Siparişi

Switch:

`İzin Ver / İzin Verme`

Global ayardır.

Eğer ürün bazında daha özel bir ayar ileride eklenirse ürün ayarı global ayarı override edebilir.

---

# 8. Stok Ayarları

Kart başlığı:

`Stok Ayarları`

## Stok Takibi

Switch:

`Aktif / Pasif`

Pasif olduğunda ürünlerde stok kontrolü yapılmaz.

---

## Düşük Stok Uyarı Limiti

Number input

Örnek:

`10`

Bir ürünün stoğu bu değerin altına düştüğünde düşük stok olarak değerlendirilebilir.

---

## Stok Bitince

Select:

- `Satışı Durdur`
- `Satışa Devam Et`

---

## Ürün Bazlı Override Mantığı

İleride ürün bazında özel stok limiti tanımlanırsa:

1. Ürünün kendi değeri varsa ürün değeri kullanılır.
2. Ürün özel değeri yoksa Site Ayarları değerleri kullanılır.

---

# 9. Firma / Fatura Bilgileri

Kart başlığı:

`Firma / Fatura Bilgileri`

Alanlar:

### Firma Unvanı
Text input

### Vergi Dairesi
Text input

### Vergi Numarası
Text input

### MERSİS No
Text input

Opsiyonel.

### Firma Adresi
Textarea

Bu bilgiler gerektiğinde fatura, sipariş çıktısı veya footer gibi alanlarda kullanılabilir.

---

# 10. Sosyal Medya

Kart başlığı:

`Sosyal Medya`

Alanlar URL input şeklinde olmalı.

- Instagram
- Facebook
- X / Twitter
- LinkedIn
- YouTube
- TikTok

Boş bırakılan sosyal medya bağlantıları frontend tarafında gösterilmemelidir.

---

# 11. SEO

Kart başlığı:

`SEO Ayarları`

Bu alan yalnızca temel site SEO bilgilerini kapsamalıdır.

## SEO Başlığı
Text input

## Meta Açıklaması
Textarea

Karakter sayacı gösterilebilir.

Öneri:

`0 / 160`

## Anahtar Kelimeler
Tag input veya text input

Opsiyonel.

## Indexleme

Switch:

`Arama motorlarının siteyi indexlemesine izin ver`

Bu alan özellikle test ortamlarında yararlı olabilir.

---

# 12. Bakım Modu

Kart başlığı:

`Bakım Modu`

## Bakım Modu

Switch:

`Aktif / Pasif`

Aktif hale getirildiğinde son kullanıcı siteye normal şekilde erişememelidir.

Admin panel erişimi etkilenmemelidir.

## Bakım Başlığı

Text input

Örnek:

`Kısa Bir Ara Verdik`

## Bakım Mesajı

Textarea

Örnek:

`Sitemizde kısa süreli bir bakım çalışması gerçekleştiriyoruz. Lütfen daha sonra tekrar deneyin.`

---

# 13. Kaydetme Davranışı

`Değişiklikleri Kaydet` butonuna basıldığında:

1. Form validasyonları çalışmalı.
2. Hatalı alanlar inline gösterilmeli.
3. Kaydetme sırasında buton loading state almalı.
4. Başarılı işlem sonrası toast gösterilmeli.

Örnek:

`Site ayarları başarıyla güncellendi.`

Hata durumunda:

`Site ayarları güncellenemedi. Lütfen tekrar deneyin.`

---

# 14. Unsaved Changes

Kullanıcı bir alanı değiştirdiyse ve sayfadan ayrılmak isterse uyarı gösterilmesi önerilir.

Örnek:

`Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?`

Butonlar:

- `Sayfada Kal`
- `Değişiklikleri Kaydetmeden Çık`

---

# 15. Responsive Tasarım

## Desktop

İki kolon kullanılabilir.

Örnek:

Sol kolon:
- Genel Bilgiler
- İletişim
- Firma/Fatura
- Sosyal Medya

Sağ kolon:
- Sipariş Ayarları
- Stok Ayarları
- SEO
- Bakım Modu

Ancak kartların yüksekliği dengesiz görünüyorsa tek kolon tercih edilebilir.

## Tablet / Mobil

Kartlar tek kolon olmalıdır.

Inputlar %100 genişlikte kullanılmalıdır.

---

# 16. Önerilen Component Yapısı

```text
SiteSettingsPage
│
├── PageHeader
│
├── GeneralSettingsCard
│
├── ContactSettingsCard
│
├── OrderSettingsCard
│
├── StockSettingsCard
│
├── CompanySettingsCard
│
├── SocialMediaSettingsCard
│
├── SeoSettingsCard
│
├── MaintenanceSettingsCard
│
└── SaveActions
```

---

# 17. Önerilen Backend Model

Örnek veri modeli:

```json
{
  "general": {
    "siteName": "Eser Promo",
    "siteTitle": "Eser Promosyon Ürünleri",
    "description": "",
    "logoUrl": "",
    "faviconUrl": ""
  },
  "contact": {
    "phone": "",
    "whatsapp": "",
    "email": "",
    "address": "",
    "googleMapsUrl": ""
  },
  "order": {
    "orderNumberPrefix": "ESR",
    "minimumOrderAmount": 0,
    "orderNoteEnabled": true,
    "allowOutOfStockOrder": false
  },
  "stock": {
    "stockTrackingEnabled": true,
    "lowStockThreshold": 10,
    "outOfStockBehavior": "STOP_SALE"
  },
  "company": {
    "companyName": "",
    "taxOffice": "",
    "taxNumber": "",
    "mersisNumber": "",
    "address": ""
  },
  "socialMedia": {
    "instagram": "",
    "facebook": "",
    "twitter": "",
    "linkedin": "",
    "youtube": "",
    "tiktok": ""
  },
  "seo": {
    "title": "",
    "description": "",
    "keywords": [],
    "allowIndexing": true
  },
  "maintenance": {
    "enabled": false,
    "title": "",
    "message": ""
  }
}
```

---

# 18. Tasarım Prensibi

Bu ekranın temel prensibi:

> Operasyonel ekran değil, sade ve anlaşılır bir konfigürasyon ekranı.

Kullanıcı ayarı nerede bulacağını düşünmek zorunda kalmamalıdır.

Bu nedenle:
- KPI gösterme
- Grafik gösterme
- Dashboard bileşenleri kullanma
- Başka menülerdeki özellikleri tekrar etme

yerine yalnızca sitenin global davranışlarını yönetmeye odaklanılmalıdır.
