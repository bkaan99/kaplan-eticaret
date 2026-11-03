/**
 * Kaplan Turşu Yasal, Kurumsal ve Bilgilendirme Metinleri Şablonları.
 * 6698 sayılı KVKK, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
 * Mesafeli Sözleşmeler Yönetmeliği ile tam uyumlu hazırlanmıştır.
 */

export interface LegalPageTemplate {
  slug: string;
  title: string;
  category: "kurumsal" | "yasal";
  content: string;
}

export const LEGAL_PAGE_TEMPLATES: LegalPageTemplate[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    category: "kurumsal",
    content: `# Gelenekten Sofranıza Kaplan Turşuları

Kaplan Turşuları, Ankara'nın meşhur ve coğrafi işaret tescilli **Çubuk Turşusu** geleneğini aslına sadık kalarak, dededen toruna aktarılan geleneksel tariflerle yaşatan bir aile işletmesidir.

Toprağın bereketini, Türk mutfağının vazgeçilmez fermente lezzetleriyle birleştirerek katkısız ve doğal turşuları sofralarınızla buluşturuyoruz.

# Lezzetimizin Sırrı: Doğallık ve Sabır

Gerçek bir Çubuk turşusunu sıradan turşulardan ayıran en önemli unsurlar ustalık, sabır ve malzeme kalitesidir:

- **Taze ve Yerel Hasat:** Turşularımızda kullandığımız çıtır salatalıklar, lahanalar, domatesler ve biberler Çubuk Ovası'nın yerel çiftçilerinden sabahın erken saatlerinde taze olarak temin edilir.
- **Çankırı Kaya Tuzu:** Rafine sofra tuzu yerine, milyonlarca yıllık zengin minerallere sahip doğal Çankırı kaya tuzu kullanıyoruz.
- **Yerli Sarımsak ve Taze Baharatlar:** Aromasını keskin ve şifalı yerli sarımsak, taze dereotu ve defne yaprağından alır.
- **Doğal Fermantasyon:** Ürünlerimizde fermantasyonu hızlandırıcı kimyasallar, asit düzenleyiciler, yapay koruyucular veya renklendiriciler kesinlikle kullanılmaz. Turşularımız serin depolarda sabırla, doğal fermantasyon sürecini tamamlayarak olgunlaşır.

# Türkiye'de Bir İlk: Kendi Turşunu Yap

Geleneksel lezzetlerimizi modern teknolojiyle bir araya getirdik. Sitemiz üzerindeki **Kendi Turşunu Yap** modülü ile bidon boyutundan sebze oranlarına, acılık derecesinden aroma tercihlerine kadar tamamen damak zevkinize özel bidonunuzu tasarlayabilir, kapınıza kadar sipariş edebilirsiniz.

# Kalite ve Hijyen Standartlarımız

İmalathanemiz Tarım ve Orman Bakanlığı denetiminde, yüksek hijyen ve gıda güvenliği standartlarında üretim yapmaktadır. Tüm cam kavanozlarımız ve bidonlarımız el değmeden sterilize edilir ve güvenli kargo ambalajlarıyla sevk edilir.

Bizi tercih eden binlerce mutlu müşterimize ve sofralarında yer açan tüm turşuseverlere teşekkür ederiz.`,
  },
  {
    slug: "sikca-sorulan-sorular",
    title: "Sıkça Sorulan Sorular",
    category: "kurumsal",
    content: `# Ürünler ve Üretim

## Turşularınızda koruyucu veya katkı maddesi var mı?
Kesinlikle hayır. Kaplan Turşuları'nda yalnızca taze sebzeler, doğal Çankırı kaya tuzu, yerli sarımsak, doğal sirke ve içme suyu kullanılır. Ürünlerimizde sodyum benzoat, potasyum sorbat, yapay asit veya renklendirici bulunmaz.

## Turşunun üzerinde beyaz bir tabaka (kef) oluştu, bozulmuş mudur?
Hayır, bozulmamıştır. Koruyucusuz ve doğal fermantasyonla üretilen geleneksel turşularda hava ile temas eden yüzeyde zararsız beyaz fermantasyon mayası (kef) oluşabilir. Bu, turşunuzun katkısız ve yaşayan bir ürün olduğunun en net kanıtıdır. Temiz bir kaşık yardımıyla tabakayı alarak turşunuzu güvenle tüketmeye devam edebilirsiniz.

## Turşuları nasıl saklamalıyım?
Turşularınızı doğrudan güneş ışığı almayan, serin ve nemsiz bir ortamda muhafaza ediniz. Kapağını açtıktan sonra buzdolabında saklamanızı ve sebzelerin sürekli turşu suyunun altında kalmasını sağlamanızı tavsiye ederiz.

# Kargo, Ambalaj ve İade

## Cam kavanozlar kargoda kırılır mı? Kırılırsa ne yapmalıyım?
Tüm siparişlerimiz nakliye darbelerine karşı özel hava kanallı koruyucu ambalajlarla tek tek sarılır ve güçlendirilmiş kolilerle gönderilir. Buna rağmen nadiren de olsa kargo kaynaklı kırık veya sızıntı yaşanırsa, hasarlı ürünün fotoğrafını WhatsApp veya e-posta ile iletmeniz yeterlidir. **Aynı gün koşulsuz olarak ücretsiz yeni ürün kargolanır** veya ücretiniz iade edilir.

## Kargo ücreti ne kadar ve ne zaman teslim edilir?
500 TL ve üzeri tüm siparişlerinizde kargo **tamamen ücretsizdir**. Siparişleriniz 24-48 saat içinde kargoya verilir ve kargo takip numarası SMS ile iletilir. Teslimat genellikle kargoya verildikten sonra 1-2 iş günü içinde gerçekleşir.

## Kendi Turşunu Yap nasıl çalışır?
Sitemizdeki **Kendi Turşunu Yap** sayfasına girerek dilediğiniz bidon boyutunu (3 kg, 5 kg veya 10 kg) seçebilir; salatalık, lahana, acı biber, sarımsak gibi malzemelerin oranlarını belirleyerek tamamen size özel hazırlanan turşunuzu sipariş verebilirsiniz.`,
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    category: "yasal",
    content: `# 1. Veri Sorumlusu

6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, **Kaplan Turşu** (Kaplan Gıda ve Turşuculuk Tic. Ltd. Şti.) olarak veri sorumlusu sıfatıyla, kişisel verilerinizi mevzuata uygun şekilde işlemekte ve korumaktayız.

# 2. İşlenen Kişisel Verileriniz

Sitemizi ziyaretiniz ve sipariş süreçleriniz kapsamında aşağıdaki kişisel verileriniz işlenmektedir:

- **Kimlik Bilgileri:** Ad, soyad, T.C. kimlik numarası (bireysel fatura taleplerinde mevzuat gereği).
- **İletişim Bilgileri:** E-posta adresi, cep telefonu numarası, teslimat ve fatura adresi.
- **Müşteri İşlem Bilgileri:** Sipariş geçmişi, sepet içeriği, iade talepleri, müşteri soru ve değerlendirmeleri.
- **Ödeme ve Finansal Bilgiler:** Ödeme türü, fatura detayları (Kredi kartı bilgileriniz doğrudan lisanslı ödeme kuruluşu PayTR sunucularında 256-bit SSL korumasıyla işlenir; sistemlerimizde saklanmaz).
- **İşlem Güvenliği Bilgileri:** IP adresi, internet sitesi gezinti kayıtları, çerez kayıtları, şifrelenmiş oturum bilgileri.

# 3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri

Kişisel verileriniz, KVKK'nın 5. maddesinde belirtilen hukuki sebeplere dayanılarak aşağıdaki amaçlarla işlenir:

- **Sözleşmenin Kurulması ve İfası (KVKK m. 5/2-c):** Siparişlerinizin alınması, geleneksel turşu ve gıda ürünlerinizin hazırlanarak adresinize teslim edilmesi, üyelik hesabınızın yönetimi.
- **Hukuki Yükümlülüklerin Yerine Getirilmesi (KVKK m. 5/2-ç):** E-fatura ve sevk irsaliyelerinin düzenlenmesi, tüketici mevzuatı ve vergi kanunlarından doğan yasal saklama yükümlülükleri.
- **Meşru Menfaat (KVKK m. 5/2-f):** Müşteri memnuniyetinin ölçülmesi, operasyonel güvenliğin sağlanması ve sistem arızalarının giderilmesi.
- **Açık Rıza (KVKK m. 5/1):** Tercih etmeniz halinde kampanya, indirim ve yeni hasat duyurularının e-posta veya SMS ile iletilmesi.

# 4. Kişisel Verilerin Aktarımı

Kişisel verileriniz, yalnızca siparişin tamamlanması ve yasal gereklilikler kapsamında güvenilir iş ortaklarımıza aktarılır:

- **Kargo ve Lojistik Firmaları:** Siparişinizin adresinize ulaştırılabilmesi amacıyla ad, soyad, adres ve telefon bilgileri.
- **Yetkili Ödeme Kuruluşları:** Ödeme onayının ve tahsilatın güvenle gerçekleştirilmesi için PayTR altyapısı.
- **Hukuki Merciler ve Kamu Kurumları:** Yasal denetim veya uyuşmazlık hallerinde yetkili adli veya idari makamlar.

# 5. İlgili Kişi Olarak Haklarınız

KVKK'nın 11. maddesi uyarınca dilediğiniz zaman:

- Kişisel verilerinizin işlenip işlenmediğini öğrenme,
- İşlenmişse buna ilişkin bilgi talep etme,
- Verilerinizin amacına uygun kullanılıp kullanılmadığını öğrenme,
- Eksik veya yanlış işlenmişse düzeltilmesini isteme,
- KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini talep etme,
- Otomatik sistemler vasıtasıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme haklarına sahipsiniz.

Sitemiz üzerindeki **Hesabım** bölümünden dilediğiniz zaman verilerinizi tek tıkla indirebilir (**Verilerimi İndir**) veya hesabınızı silebilirsiniz. Diğer talepleriniz için **info@kaplantursu.com** veya **0507 542 03 01** üzerinden bize başvurabilirsiniz.`,
  },
  {
    slug: "cerez-politikasi",
    title: "Gizlilik ve Çerez Politikası",
    category: "yasal",
    content: `# 1. Çerez (Cookie) Nedir?

Çerezler, sitemizi ziyaret ettiğinizde bilgisayarınız veya mobil cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler, web sitesinin güvenli ve verimli çalışmasını sağlamak, sepetinizi hatırlamak ve alışveriş deneyiminizi kolaylaştırmak için kullanılır.

# 2. Sitemizde Kullanılan Çerez Türleri

- **Zorunlu Çerezler:** Sitemizin güvenli çalışması, kullanıcı oturumunun korunması, sepet adımları ve ödeme işlemlerinin hatasız yürümesi için zorunludur. Bu çerezler devre dışı bırakılamaz.
- **İşlevsel Çerezler:** Oturum tercihleri, son görüntülediğiniz ürünler ve sepet hatırlatmaları gibi kullanıcı deneyimini artıran unsurları hatırlar.
- **Performans ve Analitik Çerezler:** Ziyaretçi sayıları, sayfa açılış hızları ve sitede en çok ilgi gören kategorilerin anonim olarak analiz edilmesini sağlar.

# 3. Çerez Tercihlerini Yönetme

Sitemizi ilk ziyaretinizde karşınıza çıkan çerez onay bandından tercihlerinizi dilediğiniz gibi belirleyebilirsiniz. Ayrıca kullandığınız internet tarayıcısının ayarlarından dilediğiniz zaman çerezleri temizleyebilir veya engelleyebilirsiniz.

# 4. Veri ve Ödeme Güvenliği

Sitemizde tüm veri iletişimi uluslararası **256-bit SSL güvenlik sertifikası** ile şifrelenmektedir. Kredi kartı ve hassas ödeme verileriniz sistemlerimizde depolanmaz; işlemler BDDK ve TCMB lisanslı PayTR güvencesiyle 3D Secure olarak tamamlanır.`,
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    category: "yasal",
    content: `# Madde 1 - Taraflar

**Satıcı:**
- **Ünvan:** Kaplan Gıda ve Turşuculuk Tic. Ltd. Şti. (Kaplan Turşuları)
- **Adres:** Barbaros, Karagöl Cd. No:129, 06760 Çubuk / Ankara
- **Telefon:** 0507 542 03 01
- **E-posta:** info@kaplantursu.com
- **Web Sitesi:** kaplantursu.com

**Alıcı (Tüketici):**
- Sipariş esnasında adı, soyadı, teslimat adresi ve iletişim bilgileri elektronik formda belirtilen gerçek veya tüzel kişidir.

# Madde 2 - Sözleşmenin Konusu

İşbu sözleşmenin konusu; Alıcı'nın Satıcı'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği geleneksel ev yapımı Çubuk turşusu, şalgam suyu veya kişiselleştirilmiş turşu ürünlerinin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.

# Madde 3 - Ürün, Fiyat ve Ödeme Bilgileri

Ürünlerin cinsi, miktarı, birim fiyatı, KDV dahil toplam satış tutarı ve kargo bedeli sipariş özetinde ve Alıcı'ya iletilen sipariş teyit e-postasında açıkça gösterilir. Ödemeler kredi kartı (PayTR 256-bit SSL), banka kartı veya onaylı bayiler için tanımlanan havale yöntemleriyle tahsil edilir.

# Madde 4 - Teslimat ve Ambalaj Güvencesi

- Satıcı, sipariş onayından itibaren siparişi en geç **1-3 iş günü** içerisinde anlaşmalı kargo firmasına teslim eder.
- Tüm cam kavanozlar, nakliye esnasında kırılma ve sızdırmaya karşı koruma sağlayan özel darbe emici hava yastıklı ambalajlarla paketlenir.
- **500 TL ve üzeri** siparişlerde kargo ücretsizdir.

# Madde 5 - Cayma Hakkı ve İstisnalar

- Alıcı, gıda ürününün tesliminden itibaren **14 gün** içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir.
- **İstisnalar:** Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca, tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan gıda maddelerinde sağlık ve hijyen kuralları nedeniyle cayma hakkı kullanılamaz.
- **Hasar Güvencesi:** Kargo teslimatı sırasında kırık, çatlak veya sızıntılı tespit edilen ürünler tutanakla veya fotoğraf ile bildirildiğinde, Satıcı tarafından koşulsuz olarak ücretsiz yenisi gönderilir veya ücret iadesi yapılır.

# Madde 6 - Yetkili Mahkeme

İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.`,
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    category: "yasal",
    content: `# 1. Satıcı Bilgileri

- **Firma:** Kaplan Gıda ve Turşuculuk Tic. Ltd. Şti. (Kaplan Turşuları)
- **Adres:** Barbaros, Karagöl Cd. No:129, 06760 Çubuk / Ankara
- **Telefon:** 0507 542 03 01
- **E-posta:** info@kaplantursu.com

# 2. Ürün ve Sipariş Bilgileri

Sipariş edilen geleneksel turşuların adı, bidon/kavanoz boyutu, adedi, KDV dahil toplam satış fiyatı ve kargo ücreti ödeme ekranında detaylı olarak sunulur.

# 3. Ödeme ve Sevkiyat

- Ödemeleriniz 256-bit SSL korumalı lisanslı PayTR altyapısı üzerinden 3D Secure güvencesiyle gerçekleştirilir.
- Siparişleriniz anlaşmalı kargo güvencesiyle hava yastıklı özel kırılmaz ambalajlarda 24-48 saat içerisinde kargoya teslim edilir. Kargo takip bağlantısı e-posta ve SMS ile iletilir.
- 500 TL ve üzeri siparişlerde kargo ücreti alınmaz.

# 4. Cayma Hakkı ve İade

Tüketici, teslim tarihinden itibaren 14 gün içinde yasal cayma hakkına sahiptir. Ambalajı açılmamış, güvenlik bandı bozulmamış ürünler iade edilebilir. Açılmış veya hijyeni bozulmuş gıda ürünleri yönetmelik gereği iade kapsamı dışındadır.`,
  },
  {
    slug: "iade-ve-iptal-kosullari",
    title: "İptal ve İade Koşulları",
    category: "yasal",
    content: `# 1. Sipariş İptali

- Siparişiniz henüz kargoya teslim edilmemişse, **Hesabım > Siparişlerim** sayfasından tek tıkla iptal talebi oluşturabilir veya **0507 542 03 01** numaralı hattımızdan müşteri temsilcimize ulaşabilirsiniz.
- İptal edilen siparişlerin ücreti, ödeme yaptığınız kredi/banka kartınıza kesintisiz olarak 1-3 iş günü içinde iade edilir.

# 2. %100 Kırık veya Hasarlı Ürün Güvencesi

Cam kavanozlarımızın ve turşu bidonlarımızın güvenliği tamamen bizim sorumluluğumuzdadır. Paketleme esnasında kırılmaz hava yastıkları ve güçlendirilmiş koliler kullanılmaktadır. Buna rağmen kargo taşınması sırasında kırılan, çatlayan veya sızdıran herhangi bir ürün olursa:

- Kargo görevlisine tutanak tutturabilir veya hasarlı ürünün fotoğrafını **info@kaplantursu.com** ya da WhatsApp hattımıza iletebilirsiniz.
- Hasarlı ürünler için hiçbir ek kargo veya ürün bedeli talep edilmeden **aynı gün yeni ürün kargolanır** veya talep ederseniz tutar derhal iade edilir.

# 3. Yasal Cayma ve İade Süreci

- Teslim aldığınız tarihten itibaren **14 gün** içinde, ambalajı açılmamış ve emniyet şeridi bozulmamış ürünler için cayma hakkınızı kullanabilirsiniz.
- Gıda maddesi olması sebebiyle kapağı açılmış, koruyucu güvenlik kilidi sökülmüş ürünler hijyen ve sağlık mevzuatı gereği iade alınamaz.
- İade onaylandıktan sonra ürün bedeli 3-5 iş günü içinde bankanıza aktarılır.`,
  },
  {
    slug: "teslimat-ve-kargo",
    title: "Teslimat ve Kargo Bilgileri",
    category: "yasal",
    content: `# 1. Kargo Ücretleri ve Ücretsiz Kargo Eşiği

- **500 TL ve üzeri** tüm siparişlerinizde Türkiye'nin her yerine **Kargo Ücretsizdir**.
- 500 TL altındaki siparişlerde sabit ve ekonomik standart kargo ücreti uygulanır; ödeme adımında sepetinize net olarak yansıtılır.

# 2. Kırılmaz Özel Ambalaj Güvencesi

Cam kavanoz turşularımız ve şalgam sularımız sıradan koliyle gönderilmez:

- Her bir kavanoz, darbe emici hava yastıklı strafor koruyucular içerisine tek tek yerleştirilir.
- Koliler sızdırmazlık bantlarıyla mühürlenir ve darbelere dayanıklı hale getirilir.
- Siparişiniz kapınıza sağlam, sızdırmaz ve taze ulaşana dek Kaplan Turşuları güvencesi altındadır.

# 3. Teslimat Süresi

- Hafta içi saat 14:00'e kadar verilen siparişler aynı gün veya en geç ertesi iş günü kargoya teslim edilir.
- Kargo firmaları, bulunduğunuz ile ve ilçeye bağlı olarak ortalama **24 ila 48 saat** içerisinde adrese teslimat sağlamaktadır.
- Siparişiniz kargoya verildiğinde SMS ve e-posta ile anlık kargo takip bağlantısı iletilir. Ayrıca sitemizdeki **Sipariş Sorgula** sayfasından sipariş numaranızla durumunu takip edebilirsiniz.`,
  },
];
