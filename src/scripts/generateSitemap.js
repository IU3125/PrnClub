const fs = require('fs');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase yapılandırmasını yükle
const firebaseConfig = {
  // Burada Firebase yapılandırmanız olmalı
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sabit sayfalar
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/videos', changefreq: 'daily', priority: 0.9 },
  { url: '/categories', changefreq: 'weekly', priority: 0.8 },
  { url: '/pornstars', changefreq: 'weekly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.5 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/sss', changefreq: 'monthly', priority: 0.5 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/dmca', changefreq: 'yearly', priority: 0.3 },
  { url: '/cookie', changefreq: 'yearly', priority: 0.3 },
  { url: '/2257', changefreq: 'yearly', priority: 0.3 },
];

// Ana fonksiyon
async function generateSitemap() {
  try {
    const links = [...staticPages];
    
    // Video sayfalarını ekle
    const videosSnapshot = await getDocs(collection(db, 'videos'));
    for (const doc of videosSnapshot.docs) {
      const video = doc.data();
      links.push({
        url: `/video/${doc.id}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: video.updatedAt ? new Date(video.updatedAt.toDate()).toISOString() : new Date().toISOString()
      });
    }

    // Kategori sayfalarını ekle
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    for (const doc of categoriesSnapshot.docs) {
      const category = doc.data();
      links.push({
        url: `/category/videos/${category.name}`,
        changefreq: 'weekly',
        priority: 0.6
      });
    }

    // Sitemap stream oluştur
    const stream = new SitemapStream({ hostname: 'https://www.prnclub.com' });
    const data = await streamToPromise(Readable.from(links).pipe(stream));
    
    // Sitemap.xml dosyasını kaydet
    fs.writeFileSync('./public/sitemap.xml', data.toString());
    console.log('Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap(); 