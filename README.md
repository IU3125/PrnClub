<<<<<<< HEAD
# PrnClub
=======
# PRN Club - Video Platformu

Bu proje, React ve Tailwind CSS kullanılarak geliştirilmiş, Firebase altyapısı ile desteklenen bir video paylaşım platformudur. Sistem, iki farklı admin tipine sahip bir yönetim paneli ve kullanıcıların videoları izleyebileceği bir ana site içermektedir.

## Özellikler

### Admin Paneli

#### Giriş Sistemi
- Sadece belirlenen e-posta ve şifrelerle giriş yapılabilir
- 8 karakterli şifre gerekliliği
- Yanlış e-posta veya şifre girildiğinde hata mesajı gösterilir

#### Admin Tipleri
- **Baş Admin**: Tüm bölümlere erişebilir ve yönetebilir
- **Reklam Admini**: Sadece Dashboard ve Advertisement bölümlerine erişebilir, diğer bölümleri görebilir fakat giriş yapamaz

#### Menü Çubuğu
- **Dashboard**: Ana kontrol paneli, genel istatistikler
- **Users**: Kullanıcı yönetimi (kullanıcıları görüntüleme, düzenleme, silme)
- **Videos**: Video yönetimi (videoları listeleme ve düzenleme)
- **Comments**: Kullanıcı yorumlarını yönetme (görüntüleme, düzenleme, silme)
- **Category**: Video kategorilerini yönetme
- **Advertisement**: Reklam yönetimi
- **Profile**: Kullanıcı profil ayarları

### Ana Site

#### Giriş/Kayıt Olma
- Kullanıcılar e-posta ve minimum 8 karakterli şifre ile kayıt olabilir
- Giriş yapmayan kullanıcılar bazı özelliklerden yararlanamaz

#### Ana Sayfa İçeriği
- Logo (PRN Club): Platformun logosu
- Arama Çubuğu: Videolar arasında arama yapma imkanı
- Kullanıcı Karşılama: Kullanıcının adı ile kişisel bir selamlama
- Featured: Kullanıcının favorilere eklediği videolar (sadece giriş yapmış kullanıcılar için aktif)
- Yenile Butonu: Sayfayı yenilemek için ikon

#### Filtreleme Seçenekleri
- Videos (video türüne göre filtreleme)
- Category (kategoriye göre filtreleme)
- Pornstar (oyunculara göre filtreleme)

#### Video Kartları
- Başlık (videonun adı)
- Yükleyen kişi
- İzlenme sayısı ve süresi

#### Video Detay Sayfası
- Video oynatıcı
- Video adı
- Açıklama
- Yükleyen kişi
- İzlenme sayısı
- Beğeni / Beğenmeme durumu
- Yorum bölümü
- Tags (etiketler)
- Featured butonu: Kullanıcının videoyu favorilere ekleyebilmesi (sadece giriş yapanlar için aktif)
- Oyuncular: Videodaki aktörlerin isimleri
- İlgili Videolar: Tag ve aktör isimlerine göre toplam 8 önerilen video

## Teknolojiler

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Video Entegrasyonu**: iframe kodları ile
- **Resimler**: URL bağlantıları ile

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullanici-adi/prn-club.git
cd prn-club
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Firebase projenizi oluşturun ve yapılandırın:
   - [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun
   - Authentication, Firestore ve Storage servislerini etkinleştirin
   - Web uygulaması ekleyin ve yapılandırma bilgilerini alın

4. `.env` dosyası oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

5. Uygulamayı başlatın:
```bash
npm start
```

## Proje Yapısı

```
src/
├── components/         # Yeniden kullanılabilir bileşenler
│   ├── admin/          # Admin paneli bileşenleri
│   ├── auth/           # Kimlik doğrulama bileşenleri
│   ├── layout/         # Düzen bileşenleri (Header, Footer, vb.)
│   ├── ui/             # UI bileşenleri (Button, Card, vb.)
│   └── video/          # Video ile ilgili bileşenler
├── context/            # React Context API dosyaları
├── firebase/           # Firebase yapılandırması ve yardımcı fonksiyonlar
├── hooks/              # Özel React hooks
├── pages/              # Sayfa bileşenleri
│   ├── admin/          # Admin paneli sayfaları
│   └── client/         # Ana site sayfaları
├── routes/             # Rota yapılandırması
├── styles/             # Global stil dosyaları
└── utils/              # Yardımcı fonksiyonlar
```

## Yapılacaklar

1. **Proje Kurulumu**
   - React uygulaması oluşturma
   - Tailwind CSS entegrasyonu
   - Firebase yapılandırması

2. **Kimlik Doğrulama Sistemi**
   - Kullanıcı kaydı ve girişi
   - Admin girişi ve yetkilendirme
   - Şifre sıfırlama

3. **Admin Paneli**
   - Dashboard tasarımı ve istatistikler
   - Kullanıcı yönetimi
   - Video yönetimi
   - Yorum yönetimi
   - Kategori yönetimi
   - Reklam yönetimi
   - Profil ayarları

4. **Ana Site**
   - Ana sayfa tasarımı
   - Video kartları ve listeleme
   - Video detay sayfası
   - Arama ve filtreleme özellikleri
   - Kullanıcı profil sayfası
   - Favori video sistemi

5. **Video Entegrasyonu**
   - iframe kodları ile video oynatıcı
   - Video bilgilerinin Firestore'da saklanması
   - Video önizleme resimlerinin URL olarak saklanması

6. **Veritabanı Tasarımı**
   - Kullanıcı koleksiyonu
   - Video koleksiyonu
   - Kategori koleksiyonu
   - Yorum koleksiyonu
   - Oyuncu koleksiyonu
   - Etiket koleksiyonu

7. **Duyarlı Tasarım**
   - Mobil uyumlu arayüz
   - Tablet uyumlu arayüz
   - Masaüstü uyumlu arayüz

8. **Performans Optimizasyonu**
   - Lazy loading
   - Kod bölme (code splitting)
   - Önbelleğe alma (caching)

9. **Güvenlik**
   - Firebase güvenlik kuralları
   - Kullanıcı yetkilendirme kontrolleri
   - Veri doğrulama

10. **Test ve Hata Ayıklama**
    - Birim testleri
    - Entegrasyon testleri
    - Kullanıcı arayüzü testleri 
>>>>>>> 29c7b78 (Website files added)
