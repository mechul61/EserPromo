# EserPromo

Custom e-ticaret: Next.js + Postgres + Docker. Katalog Etkin API’den kontrollü senkron ile gelir. Üyelik, sepet, sipariş ve Iyzico ödemesi bu stack üzerinde çalışır.

## Kilitlemiş kurallar

- **Kanonik ürün URL:** WP ile aynı — `/urun/{baslik-slug}-{urun_id}/`
- **Kategori URL:** WP ile aynı — `/product-category/{isim-slug}-{kategori_id}/`
- **Sepet/sipariş:** her zaman Etkin `urun_id` (varyant).
- **Kart verisi saklanmaz.** Ödeme Iyzico Checkout Form.
- **Etkin API sırları** sadece sync job’da; vitrin sayfası API’ye gitmez.
- Hesap / sepet / sipariş sayfaları `noindex`.

## Lokal kurulum

1. `docker compose -f docker-compose.dev.yml up -d`
2. `.env` ve `web/.env`: `AUTH_SECRET` (en az 32 karakter), `EBAYI_EPOSTA`
3. `cd web && npm install && npx prisma migrate dev && npm run dev`

Site: http://localhost:3000  
Örnek ürün: `/urun/plastik-kalem-0506` (`npm run sync:import-sample` sonrası)

## Güvenlik notu

`.env` commit edilmez. Hash, Iyzico anahtarı, `AUTH_SECRET` asla istemciye çıkmaz.
