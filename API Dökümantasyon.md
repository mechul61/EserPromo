Entegrasyon Rehberi
WEBSERVİS hizmeti tüm ürünlerin başka sistemlere (web siteleri, yazılımlar vb..) aktarılmasını kolaylaştıran ÜCRETSİZ olarak sunulan bir alt yapı hizmetidir.
Bu hizmetin tüm sunucu maliyet ve giderleri ETKİN PROMOSYON tarafından karşılaşmakta olup, herhangi bir yazılım veya eklenti (Yazılım Teknik desteği hariç) desteği verilmemektedir.

Aktif Sezon	Sezon Başlangıç	API Sürümü	API Son Güncelleme
2026	08 Eylül 2025	v0.3.5.4	30 Ekim 2024
UYARI Bu Servisi Kullanmadan önce E-Bayi Panelinizde Hesabım > Site Ayarları > API Ayarları sayfasında Site adresi ve Site Dış Bacak IP adresinizin kayıt edilmiş ve de Onaylanmış olması gerekmektedir. Onay verilmediği taktirde bu Web Servisi yetkiniz olmadığı için veri sağlamayacaktır.

ÖNEMLİ BİLGİLENDİRME CPanel veya Reseller hosting panelinizde yazan IP adresi, Web Sitenizin DIŞ Bacak IP adresi değildir.
Bu sebepten ötürü Soru & Cevap bölümünde verilen kod ile DIŞ bacak IP adresini tespit etmeniz önerilmektedir.
Başvuru yapmadan Local de çalışabileceğiniz Başlangıç Paketini buradan indirebilirsiniz. (PHP Örnekleri ve JSON veri çıktıları içerir.)

Ön Tanıtım


Web Servisi JSON POST <> JSON tekniği ile çalışmaktadır.
Sorgu (Request) POST methodu ile JSON türünde yapılmalıdır. Dönen Cevap (Response) da JSON formatında dönecektir.
Rehber de ayrıca Sorgu Örnekleri, Parametre açıklamaları ve Parametre alt sorgu türleri de anlatılmaktadır.

Teknik Kurallar
Entegrasyon işlemlerini düzgün gerçekleştirebilmek için aşağıdaki kurallara uymanız gerekmektedir;

Aşağıda belirtilen teknikleri uygulayamazsınız:
CyotekWebCopy, HTTrack, Octoparse, Getleft gibi programların kullanılması yasaktır Ceza: IP adresi Yasaklama
API Reader (Verilerin anlık olarak sorgulanması) vb tekniklerin kullanılması yasaktır Ceza: IP adresi Yasaklama
Ürün Resimlerinin API Sunucusundan direk (HOTLINK) olarak kullanılması yasaktır Ceza: IP adresi Yasaklama
Aşağıda belirtilen tekniklere Anlık Sınırsız kullanım izni verilmektedir:
Tekil Ürün Stok Sorgulaması (Toplu olarak yapılması önerilmez)
Tekil Fiyat Stok Sorgulaması (Toplu olarak yapılması önerilmez)
API Bilgileri (Zorunlu Parametreler)
Aşağıda Belirtilen Parametreler zorunlu olarak POST edilmelidir.

Zorunlu Parametreler	Tür	Açıklama
adres	String	http://www.birikimpromosyon.com/api/json/
User-Agent	Header Array	Web Sitenizin adresi www. olmadan yazılmalı (ör: etkinpromosyon.com) Dış Bacak IP adresiniz ile web sitenizin adresi ile eşleşme doğrulaması yapılmaktadır. Kullanım şekline Örnek kodlamalardan bakınız.
hash	JSON Array	E-Bayi Hesabınıza ait HASH Kodu yazılmalıdır. E-Bayi Panelinizde bulabilirsiniz.
ebayi_eposta	JSON Array	E-Bayi Kullanıcı adınız
Sorgu Türleri (Ana Parametreler)
Belirtilen Parametre türleri Ana Sorgu türlerini oluşturmaktadır.

Parametre (Tip)	Açıklama
index	Mevcut Sezon Bilgileri, Tüm ürünlerin indeksi ve Tüm Kategorilerin indekslerini ve bu verilerin MD5 verilerini döndürür.
tekil_stok	ID si belirtilen Ürüne ait stok verilerini döndürür.
tekil_fiyat	ID si belirtilen Ürüne ait Fiyat, KDV verilerini döndürür.
tekil_stok_fiyat	ID si belirtilen Ürüne ait Stok, Fiyat, KDV verilerini döndürür.
tekil_urun	ID si belirtilen Ürüne ait tüm verilerini döndürür.
tekil_kategori	ID si belirtilen Kategoriye ait tüm verilerini döndürür.
tum_stoklar	Tüm ürünlere ait Stok verilerini döndürür.
tum_stoklar_grup	Tüm ürünlere ait Stok, Ürün Kodu, Ürün Kod Grup, Ebat, Renk, Fiyat ve KDV verilerini döndürür.
tum_fiyatlar	Tüm ürünlere ait Fiyat, KDV verilerini döndürür.
tum_stok_fiyatlar	Tüm ürünlere ait Stok ve Fiyat, KDV verilerini döndürür.
tum_resimler	Tüm Ürünlere ait tüm resimleri döndürür.
tum_ustkategoriler	Tüm Üst Kategorilere ait tüm verilerini döndürür.
tum_altkategoriler	Tüm Alt Kategorilere ait tüm verilerini döndürür.
tum_kategoriler	Tüm Kategorilere ait tüm verilerini döndürür.
tum_kategoriler_hiyerasi	Tüm Kategorilere ait tüm verileri Üst / Alt Kategori olarak Hiyeşari şeklinde döndürür.
tum_urunler	Tüm Ürünlere ait tüm verilerini döndürür.
tum_urunler_varyant	Tüm Ürünlere ait tüm verileri Varyant Tipinde (Alt varyantları ile beraber) döndürür.
tum_stoklar_varyant	Tüm Ürünlere ait Stok, Ürün Kodu, Ürün Kod Grup, Ebat, Renk, Fiyat ve KDV verilerini Varyant Tipinde (Alt varyantları ile beraber) döndürür.
tum_traseler	Trasesi (Çizim Şablon Dosyası) olan ürünleri Trase Boyut / Dosya adı / Adres verileri ile beraber Ürün ID indeksi olarak veri döndürür.
array_index	Mevcut Sezon Bilgileri ve Array olarak belirtilen Kategori, Ürün ID lerinin indekslerini ve MD5 verilerini döndürür.
array_kategoriler	Array olarak belirtilen Kategori ID lere ait tüm verileri döndürür.
array_kategori_urunler	Array olarak belirtilen Kategori ID ler içerisinde bulunan ürünlere ait tüm verileri döndürür.
array_varyant_kategori_urunler	Array olarak belirtilen Kategori ID ler içerisinde bulunan ürünlere ait tüm verileri varyant biçiminde döndürür.
array_urunler	Array olarak belirtilen Ürün ID lerine ait tüm verileri döndürür.
array_stoklar	Array olarak belirtilen Ürün ID lerine ait tüm Stok verilerini döndürür.
array_stok_fiyatlar	Array olarak belirtilen Ürün ID lerine ait tüm Stok ve Fiyat verilerini döndürür.
POST JSON Parametreleri
Ana Parametrelerin hangi alt parametreler ile kullanılabileceği hakkında bilgileri kapsar

index
Ekstra Parametre seçeneği yok

tekil_stok
JSON Parametre	Alt Parametre	Açıklama
urun_id		Ürün ID Numeric (int) şeklinde gönderilmeli
tekil_fiyat
JSON Parametre	Alt Parametre	Açıklama
urun_id		Ürün ID Numeric (int) şeklinde gönderilmeli
tekil_stok_fiyat
JSON Parametre	Alt Parametre	Açıklama
urun_id		Ürün ID Numeric (int) şeklinde gönderilmeli
tekil_urun
JSON Parametre	Alt Parametre	Açıklama
urun_id		Ürün ID Numeric (int) şeklinde gönderilmeli
tekil_kategori
JSON Parametre	Alt Parametre	Açıklama
kategori_id		Kategori ID Numeric (int) şeklinde gönderilmeli
tum_stoklar
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Stok Sayısı / Artan (Ascending) Göre Sıralama
DESC	Stok Sayısı / Azalana (Descending) Göre Sıralama
tum_stoklar_grup
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Stok Sayısı / Artan (Ascending) Göre Sıralama
DESC	Stok Sayısı / Azalana (Descending) Göre Sıralama
tum_fiyatlar
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Fiyat Miktarı / Artan (Ascending) Göre Sıralama
DESC	Fiyat Miktarı / Azalana (Descending) Göre Sıralama
tum_stok_fiyatlar
Ekstra Parametre seçeneği yok

tum_resimler
Ekstra Parametre seçeneği yok

tum_ustkategoriler
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> ustkategori_id	kategori_id	Kategori ID sine göre
isim	Kategori ismine göre
ustkategori_id	Üst Kategori ID sine Göre
anasayfa_gosterim	Ana Sayfa Gösterimine Göre
anasayfa_sira	Ana Sayfa Sırasına Göre
sira	Normal Sıralamaya Göre
tum_altkategoriler
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> sira	kategori_id	Kategori ID sine göre
isim	Kategori ismine göre
ustkategori_id	Üst Kategori ID sine Göre
anasayfa_gosterim	Ana Sayfa Gösterimine Göre
anasayfa_sira	Ana Sayfa Sırasına Göre
sira	Normal Sıralamaya Göre
tum_kategoriler
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> ustkategori_id	kategori_id	Kategori ID sine göre
isim	Kategori ismine göre
ustkategori_id	Üst Kategori ID sine Göre
anasayfa_gosterim	Ana Sayfa Gösterimine Göre
anasayfa_sira	Ana Sayfa Sırasına Göre
sira	Normal Sıralamaya Göre
tum_kategoriler_hiyerasi
Ekstra Parametre seçeneği yok

tum_urunler
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> urun_id	isim	Ürün ismine göre
urunkodu	Ürün Koduna Göre
fiyat	Ürün Fiyatına Göre
sira	Ürün Sıralama Değerine Göre
katalogsayfa	Ürün Katalog Sayfasına Göre
urun_id	Ürün ID sine Göre
tum_urunler_varyant
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> urun_id	isim	Ürün ismine göre
urunkodu	Ürün Koduna Göre
fiyat	Ürün Fiyatına Göre
sira	Ürün Sıralama Değerine Göre
katalogsayfa	Ürün Katalog Sayfasına Göre
urun_id	Ürün ID sine Göre
tum_stoklar_varyant
JSON Parametre	Alt Parametre	Açıklama
siralama varsayılan -> DESC	ASC	Stok Sayısı / Artan (Ascending) Göre Sıralama
DESC	Stok Sayısı / Azalana (Descending) Göre Sıralama
tum_traseler
Ekstra Parametre seçeneği yok

array_index
Bu Parametre de Kategori Array ID leri belirtilir ve Ürün Array ID verisi boş olur ise Ürünler İndeksi sadece belirtilen Kategori ID ler içerisindeki ürünler olacaktır.

JSON Parametre	Alt Parametre	Açıklama
array_kategoriler array	[100,92]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
array_urunler array	[11444,15226]	Array içerisinde ID ler Numeric (int) belirtilmelidir.
array_kategoriler
JSON Parametre	Alt Parametre	Açıklama
array_kategoriler array	[100,92]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> ustkategori_id	kategori_id	Kategori ID sine göre
isim	Kategori ismine göre
ustkategori_id	Üst Kategori ID sine Göre
anasayfa_gosterim	Ana Sayfa Gösterimine Göre
anasayfa_sira	Ana Sayfa Sırasına Göre
sira	Normal Sıralamaya Göre
array_kategori_urunler
JSON Parametre	Alt Parametre	Açıklama
array_kategoriler array	[100,92]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> urun_id	isim	Ürün ismine göre
urunkodu	Ürün Koduna Göre
fiyat	Ürün Fiyatına Göre
sira	Ürün Sıralama Değerine Göre
katalogsayfa	Ürün Katalog Sayfasına Göre
urun_id	Ürün ID sine Göre
array_varyant_kategori_urunler
JSON Parametre	Alt Parametre	Açıklama
array_kategoriler array	[100,92]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> urun_id	isim	Ürün ismine göre
urunkodu	Ürün Koduna Göre
fiyat	Ürün Fiyatına Göre
sira	Ürün Sıralama Değerine Göre
katalogsayfa	Ürün Katalog Sayfasına Göre
urun_id	Ürün ID sine Göre
array_urunler
JSON Parametre	Alt Parametre	Açıklama
array_urunler array	[11444,15226]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
siralama varsayılan -> DESC	ASC	Seçilen Sıralama Tipine Göre / Artan (Ascending) Göre Sıralama
DESC	Seçilen Sıralama Tipine Göre / Azalana (Descending) Göre Sıralama
siralama_tipi varsayılan -> urun_id	isim	Ürün ismine göre
urunkodu	Ürün Koduna Göre
fiyat	Ürün Fiyatına Göre
sira	Ürün Sıralama Değerine Göre
katalogsayfa	Ürün Katalog Sayfasına Göre
urun_id	Ürün ID sine Göre
array_stoklar
JSON Parametre	Alt Parametre	Açıklama
array_urunler array	[11444,15226]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
array_stok_fiyatlar
JSON Parametre	Alt Parametre	Açıklama
array_urunler array	[11444,15226]	Array içerisinde ID ler Numeric (int) olarak belirtilmelidir.
Dönüş Parametreleri
Dönen Cevap içerisinde bulunan Parametrelerin hakkında bilgi sağlar.

index
JSON Parametre	Alt Parametre	Açıklama
sezonbilgiler	sezonyili	Mevcut Sezon Yıl bilgisi
katalog_url	Mevcut Sezon Güncel Katalog Adresi
fiyatlistesi_url	Mevcut Sezon Güncel Fiyat Listesi Adresi
baskifiyatlistesi_url	Mevcut Sezon Güncel Baskı Fiyat Listesi Adresi
toplam_kategori	Mevcut Sezona ait Toplam Kategori Sayısı
toplam_urun	Mevcut Sezona ait Toplam Ürün Sayısı
kategoriler array	kategori_id	Kategorilere ait ID bilgileri ve MD5 verileri
urunler array	urun_id	Ürünlere ait ID bilgileri ve MD5 verileri
tekil_stok
JSON Parametre	Alt Parametre	Açıklama
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
tekil_fiyat
JSON Parametre	Alt Parametre	Açıklama
urun_fiyat		Ürüne ait Fiyat Değeri
urun_fiyat_virgul		Ürüne ait Fiyat Değeri / Alternatif Karakter
fiyat_kdv		Ürüne ait KDV Değeri
tekil_stok_fiyat
JSON Parametre	Alt Parametre	Açıklama
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
urun_fiyat		Ürüne ait Fiyat Değeri
urun_fiyat_virgul		Ürüne ait Fiyat Değeri / Alternatif Karakter
fiyat_kdv		Ürüne ait KDV Değeri
tekil_urun
JSON Parametre	Alt Parametre	Açıklama
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, urun_trase,urun_trase_dosya_isim,urun_trase_dosya_boyut, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tekil_kategori
JSON Parametre	Alt Parametre	Açıklama
kategori_id		Kategori ID (Unique) Numarası
ustkategori_id		Kategori ye ait Üst Kategori ID sini belirtir
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. ustkategori_id, isim, sira, resim, aciklama değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tum_stoklar
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
tum_stoklar_grup
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
tum_fiyatlar
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
urun_fiyat		Ürüne ait Fiyat Değeri
urun_fiyat_virgul		Ürüne ait Fiyat Değeri / Alternatif Karakter
fiyat_kdv		Ürüne ait KDV Değeri
tum_stok_fiyatlar
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
urun_fiyat		Ürüne ait Fiyat Değeri
urun_fiyat_virgul		Ürüne ait Fiyat Değeri / Alternatif Karakter
fiyat_kdv		Ürüne ait KDV Değeri
tum_resimler
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
tum_ustkategoriler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
kategori_id		Kategori ID (Unique) Numarası
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. isim, sira, resim, aciklama değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tum_altkategoriler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
kategori_id		Kategori ID (Unique) Numarası
ustkategori_id		Kategori ye ait Üst Kategori ID sini belirtir
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. ustkategori_id, isim, sira, resim, aciklama değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tum_kategoriler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
kategori_id		Kategori ID (Unique) Numarası
ustkategori_id		Kategori ye ait Üst Kategori ID sini belirtir
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. ustkategori_id, isim, sira, resim, aciklama değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tum_kategoriler_hiyerasi
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
kategori_id		Kategori ID (Unique) Numarası
ustkategori_id		Kategori ye ait Üst Kategori ID sini belirtir
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. ustkategori_id, isim, sira, resim, aciklama, alt_kategoriler değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
alt_kategoriler array		alt_kategoriler nesnesi içinde array oluşur
[]		Alt Kategorilerin verileri Ana Kategori Dönüş Parametreleri ile aynıdır
tum_urunler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, urun_trase,urun_trase_dosya_isim,urun_trase_dosya_boyut, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
tum_urunler_varyant
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
varyantlar array		varyantlar nesnesi içinde array oluşur
Alt Varyantların Nesneleri Ürün Dönüş Parametreleri ile aynıdır
tum_stoklar_varyant
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
varyantlar array		varyantlar nesnesi içinde array oluşur
Alt Varyantların Nesneleri Ana Stok Dönüş Parametreleri ile aynıdır
tum_traseler
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürün ID bazında index
urun_id		Ürüne ait ID (Unique) Numarası
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
md5		Veri değişikliği Kontrolü yapmak içindir. urun_trase, urun_trase_dosya_isim, urun_trase_dosya_boyut değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
array_index
JSON Parametre	Alt Parametre	Açıklama
sezonbilgiler	sezonyili	Mevcut Sezon Yıl bilgisi
katalog_url	Mevcut Sezon Güncel Katalog Adresi
fiyatlistesi_url	Mevcut Sezon Güncel Fiyat Listesi Adresi
baskifiyatlistesi_url	Mevcut Sezon Güncel Baskı Fiyat Listesi Adresi
toplam_kategori	Mevcut Sezona ait Toplam Kategori Sayısı
toplam_urun	Mevcut Sezona ait Toplam Ürün Sayısı
kategoriler array	kategori_id	Kategorilere ait ID bilgileri ve MD5 verileri
urunler array	urun_id	Ürünlere ait ID bilgileri ve MD5 verileri
array_kategoriler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
kategori_id		Kategori ID (Unique) Numarası
ustkategori_id		Kategori ye ait Üst Kategori ID sini belirtir
anasayfa_gosterim		Kategori Ana Sayfa da Gösterme (1=Evet / 0=Hayır)
anasayfa_sira		Kategori nin Ana Sayfa Sıra Değeri
isim		Kategori ismi
sira		Kategori Normal Sıra Değeri
aciklama		Kategori Açıklaması
resim		Kategori Resim Adresi
kat_icon		Kategori ufak ikon Adresi
md5		Veri değişikliği Kontrolü yapmak içindir. ustkategori_id, isim, sira, resim, aciklama değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
array_kategori_urunler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, urun_trase,urun_trase_dosya_isim,urun_trase_dosya_boyut, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
array_varyant_kategori_urunler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, urun_trase,urun_trase_dosya_isim,urun_trase_dosya_boyut, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
varyantlar array		varyantlar nesnesi içinde array oluşur
Alt Varyantların Nesneleri Ürün Dönüş Parametreleri ile aynıdır
array_urunler
JSON Parametre	Alt Parametre	Açıklama
[] array		Array index
urun_id		Ürüne ait ID (Unique) Numarası
kategori_id		Ürüne ait Kategori ID Numarası
kategori_adi		Ürüne ait Kategori ismi
urun_kodu		Ürüne ait Ürün Kodu
urun_kodgrup		Ürünün bağlı bulunduğu Kod Grubu
urun_isim		Ürünün ismi
urun_baslik		Ürün kodu ve Ürün ismi birleşik değeri
urun_aciklama		Ürün Açıklaması
urun_renk		Ürün Rengi
urun_ebat		Ürün Ebadı
sira		Ürün Sıra Değeri
ozellik		Ürüne ait Özellik Değeri
imalat		Ürünün üretim olduğunu gösterir (1=Evet / 0=Hayır)
toplam_stok		Ürünün Toplam Stok değerini gösterir
urun_fiyat		Ürünün Fiyat değerini gösterir
urun_fiyat_virgul		Ürünün Fiyat değerini gösterir / Alternatif Karakter
fiyat_kdv		Ürünün KDV değerini gösterir
kirmiziurun		Ürün de iskonto kısıtlaması var (1=Evet / 0=Hayır)
urun_trase		Ürüne ait Trase Çizim adresini belirtir
urun_trase_dosya_isim		Trase Dosya adı (dosya uzantı ile beraber)
urun_trase_dosya_boyut		Trase Dosyasının BYTE cinsinden rakamsal değeri
katalog_sayfa_no		Ürünün Katalog da hangi sayfa da olduğunu belirtir
resim1		Ürüne ait Ana Resim
resim2		Ürüne ait Ek 2. Resim
resim3		Ürüne ait Ek 3. Resim
resim4		Ürüne ait Ek 4. Resim
resim5		Ürüne ait Ek 5. Resim
resim6		Ürüne ait Ek 6. Resim
resim7		Ürüne ait Ek 7. Resim
resim8		Ürüne ait Ek 8. Resim
resim9		Ürüne ait Ek 9. Resim
md5		Veri değişikliği Kontrolü yapmak içindir. kategori_id, kategori_adi, katalog_sayfa_no, urun_isim, urun_aciklama, urun_kodu, urun_kodgrup, urun_renk, urun_ebat, ozellik, urun_trase,urun_trase_dosya_isim,urun_trase_dosya_boyut, resim1, resim2, resim3, resim4, resim5, resim6, resim7, resim8, resim9, imalat, sira değerlerinin MD5 karşılığıdır. Bu değerlerde herhangi bir değişiklik olduğunda MD5 değeri değişir.
array_stoklar
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
array_stok_fiyatlar
JSON Parametre	Alt Parametre	Açıklama
[] array		Ürünlere ait ID (Unique) Numaraları
mstok		Ürüne ait Merkez Depo Stok Değeri
istok		Ürüne ait İstanbul Depo Stok Değeri
tstok		Ürüne ait Topkapı Depo Stok Değeri
toplam_stok		Ürüne ait Toplam Stok Değeri
urun_fiyat		Ürüne ait Fiyat Değeri
urun_fiyat_virgul		Ürüne ait Fiyat Değeri / Alternatif Karakter
fiyat_kdv		Ürüne ait KDV Değeri
Örnek JSON Sorgulamaları
Bu bölümde PHP dilinde örnekler belirtilmiştir.

Tüm Kategoriler / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tum_kategoriler";

	// Verinin hangi kıstasa göre sıralanacağı belirtir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama_tipi 		= "kategori_id"; 

	// Sıralama Azalan & Artan Ayarı - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama	 	= "DESC";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'siralama_tipi' 	=> $siralama_tipi, 
		'siralama' 		=> $siralama);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Tüm Ürünler / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tum_urunler";

	// Verinin hangi kıstasa göre sıralanacağı belirtir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama_tipi 		= "fiyat"; 

	// Sıralama Azalan & Artan Ayarı - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama	 	= "DESC";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'siralama_tipi' 	=> $siralama_tipi, 
		'siralama' 		=> $siralama);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Tekil Stok / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tekil_stok";
	
	// Tekil Parametre Sorgularda ID gönderilir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$urun_id 		= "14452";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'urun_id' 		=> (int) $urun_id, // Int olması zorunlu
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Tekil Fiyat / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tekil_fiyat";
	
	// Tekil Parametre Sorgularda ID gönderilir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$urun_id 		= "14452";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'urun_id' 		=> (int) $urun_id, // Int olması zorunlu
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Tekil Kategori / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tekil_kategori";
	
	// Tekil Parametre Sorgularda ID gönderilir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$kategori_id 		= "101";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'kategori_id' 		=> (int) $kategori_id, // Int olması zorunlu
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Tekil Ürün / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "tekil_urun";
	
	// Tekil Parametre Sorgularda ID gönderilir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$urun_id 		= "14452";


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'urun_id' 		=> (int) $urun_id, // Int olması zorunlu
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Array Index / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "array_index";
	
	// Kategori ve Ürünler ID leri Array olarak gönderilmelidir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	// Kategori veya Ürün ID Array verilerinden herhangi birisi boş gönderilirse boş gönderilen parametre ilgili tablonun tüm verilerini döndürür.
	// Bu Parametre de Kategori Array ID leri belirtilir ve Ürün Array ID verisi boş olur ise Ürünler İndeksi sadece belirtilen Kategori ID ler içerisindeki ürünler olacaktır.
	$kategoriler_idler 	= [100,92];
	$urunler_idler 		= [11444,15226];


	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'array_kategoriler' 	=> $kategoriler_idler,
		'array_urunler' 	=> $urunler_idler,
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Array Kategori Ürünler / JSON POST Sorgulaması
cURL
Stream

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	// Header JSON Tipi dönen verinin tarayıcıda JSON Görünüm taslağını aktif eder.
	header("Content-type: application/json; charset=utf-8");

	// Adres JSON Parametrelerinin Gönderileceği API URL sidir.
	$adres 			= "http://www.birikimpromosyon.com/api/json/";

	// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
	$hashkodu		= "HASH Kodunuzu bu alana yazınız";

	// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
	$ebayi_eposta		= "E-Bayi Kullanıcı adınız";
	
	// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
	$website_url		= "etkinpromosyon.com";

	// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$sorgu_tipi		= "array_kategori_urunler";
	
	// Verinin hangi kıstasa göre sıralanacağı belirtir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama_tipi 		= "fiyat"; 

	// Sıralama Azalan & Artan Ayarı - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	$siralama	 	= "DESC";
	
	// Kategori ID leri Array olarak gönderilmelidir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
	// Kategori ID Array verisi gönderilmez ise tüm Ürünler Görünür. 
	// Bu Parametre Belirtilen Kategori ID leri içerisindeki ürünlerin verilerini döndürür.
	$kategoriler_idler 	= [100,92];

	$post = array(
		'ebayi_eposta' 		=> $ebayi_eposta, 
		'hash' 			=> $hashkodu,
		'tip' 			=> $sorgu_tipi, 
		'array_kategoriler' 	=> $kategoriler_idler,
		'siralama_tipi' 	=> $siralama_tipi, 
		'siralama' 		=> $siralama,
		);

	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$adres);
	curl_setopt($ch,CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($post));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt($ch, CURLOPT_USERAGENT, $website_url);
	curl_setopt($ch,CURLOPT_ENCODING,"");
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT ,3);
	curl_setopt($ch,CURLOPT_TIMEOUT, 20);
	$gelenveri = curl_exec($ch);
	curl_close ($ch);

	echo $gelenveri;

?>
Postman / JSON POST Sorgulaması
Postman Collection dosyasını buradan indirebilirsiniz. Postman a import edip aşağıda belirtilen talimatları gerçekleştiriniz.

Bölüm	Veri	Parametre	Açıklama
User-Agent	Domain ( Site Adresi )	etkinpromosyon.com	Bu parametre de domain adı yazılmalıdır (örn: etkinpromosyon.com)
Body	raw seçtikten sonra en sağdan JSON seçiniz	{ "ebayi_eposta": "ebayi eposta adresiniz", "hash": "hashkodunuz", "tip": "tum_kategoriler" }	JSON Paremetre verilerini kendi verileriniz ile eşleştirip düzenleyiniz.
Başarısız olursanız; bilgi@etkinpromosyon.com eposta adresinden destek alabilirsiniz.
Symfony Framework / Tüm Ürünler JSON POST Sorgulaması
Symfony Framework ile HttpClientInterface arayüzü ile kolayca istekte bulunabilirsiniz. Örnekte istek Controller içerisinde gösterilmiştir.

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	namespace App\Controller;

	use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
	use Symfony\Component\HttpFoundation\Response;
	use Symfony\Component\Routing\Attribute\Route;
	use Symfony\Contracts\HttpClient\HttpClientInterface;

	class EtkinPromosyonController extends AbstractController
	{
		#[Route('/etkinpromosyon', name: 'app_etkin_promosyon')]
		public function index(
			HttpClientInterface $client,
		): Response
		{
			$data = $client->request(
				'POST',
				'https://www.birikimpromosyon.com/api/json/',
				[
					'headers' => [
						'Content-Type'      => 'application/json',
						'Accept'            => 'application/json',
						// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır
						'User-Agent'        => 'etkinpromosyon.com'
					],
					'json' => [
						// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
						'ebayi_eposta' 	=> 'E-Bayi Kullanıcı adınız',
						
						// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
						'hash'		=> 'HASH Kodunuzu bu alana yazınız',
						
						// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
						'tip'		=> 'tum_urunler',
						
						// Verinin hangi kıstasa göre sıralanacağı belirtir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
						'siralama_tipi'	=> 'urun',
						
						// Sıralama Azalan & Artan Ayarı - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
						'siralama'	=> 'DESC'
					]
				]
			);

			// Gelen Veriyi Görmek için kullanabilirsiniz.
			// echo $data->getContent();

			// Örnek Döngü ile satır başı ürün kodu ile ürün ismini yazdırmak
			foreach (json_decode($data->getContent(),true) as $urun){
				echo $urun['urun_kodu']. " - " .$urun['urun_isim'] . "
";
			}

			return $this->render('etkin_promosyon/index.html.twig', [
				'controller_name' => 'EtkinPromosyonController',
			]);
		}
	}
?>
Laravel Framework / Tüm Kategoriler JSON POST Sorgulaması
Laravel Framework ile Http Client ile kolayca istekte bulunabilirsiniz. Örnekte istek Controller içerisinde gösterilmiştir.

<?php 
	#################################################################################
	## Geliştirici : Sait KURT (0 554 253 71 60) E-Posta : bilgi@ientegre.com
	#################################################################################
		
	namespace App\Http\Controllers;

	use Illuminate\View\View;
	use Illuminate\Support\Facades\Http;

	class EtkinPromosyonController extends Controller
	{
		public function entegrasyon(): View
		{
			$adres = "https://www.birikimpromosyon.com/api/json/";

			$post = [
				// E-Bayi girişinde kullandığınız E-Posta adresiniz (E-Bayi Hesabınız aktif olmalı)
				'ebayi_eposta' => 'E-Bayi Kullanıcı adınız',
				// Hash Kodu E-Bayi Panelinizde size özel olarak üretilen benzersiz anahtar kodudur.
				'hash' => 'HASH Kodunuzu bu alana yazınız',
				// Sorgu Ana Parametresi - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
				'tip' => 'tum_kategoriler',
				// Verinin hangi kıstasa göre sıralanacağı belirtir - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
				'siralama_tipi' => 'urun',
				// Sıralama Azalan & Artan Ayarı - Diğer parametreler için Entegrasyon Rehber Dökümanına bakınız.
				'siralama' => 'DESC'
			];

			// Web Sitenizin adresi (ör: etkinpromosyon.com) www. asla olmamalıdır - API Ayarlarında kaydedilen domain yazılmalıdır
			$websiteUrl = "etkinpromosyon.com";

			$response = Http::withHeaders([
				'User-Agent' => $websiteUrl,
			])
				->timeout(20)
				->post($adres, $post);

			dd(json_decode($response->body(), true));

			return view('etkinpromosyon', [
				'veriler' => $response->body()
			]);
		}
}
?>
