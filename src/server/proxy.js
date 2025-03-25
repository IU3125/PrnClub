const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc } = require('firebase/firestore');

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBxsJAJK8D_dFOXaCF8YO_IxXtU2ohVOYc",
  authDomain: "prnclub-c8ae8.firebaseapp.com",
  projectId: "prnclub-c8ae8",
  storageBucket: "prnclub-c8ae8.appspot.com",
  messagingSenderId: "1039361476559",
  appId: "1:1039361476559:web:c4e4a2b3f4c1d4c6a7b8c9",
  measurementId: "G-QWERTY12345"
};

// Firebase'i başlat
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Kategori veya oyuncu eklemek için yardımcı fonksiyon
async function addToDatabase(collectionName, name) {
  try {
    // Önce var mı diye kontrol et
    const q = query(collection(db, collectionName), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Koleksiyona göre özel alanları ayarla
      const data = {
        name: name,
        createdAt: new Date(),
        videoCount: 1
      };

      if (collectionName === 'pornstars') {
        data.views = 0;
        data.likes = 0;
        data.nationality = 'Unknown';
        data.birthDate = null;
      } else if (collectionName === 'categories') {
        data.views = 0;
        data.description = '';
        data.thumbnail = '';
      }

      // Yeni döküman oluştur
      await addDoc(collection(db, collectionName), data);
      console.log(`Added new ${collectionName}: ${name}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error adding ${collectionName}:`, error);
    return false;
  }
}

// Yardımcı fonksiyonlar
const removeDuplicates = (arr) => [...new Set(arr)].filter(Boolean);

const extractVideoInfo = ($) => {
  // Başlık
  let title = $('h1.mb').first().text().trim();
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  }

  // Açıklama
  let description = $('.video-description').text().trim();
  if (!description) {
    description = $('meta[property="og:description"]').attr('content') || 
                 $('meta[name="description"]').attr('content') || '';
  }

  // Thumbnail
  let thumbnailUrl = $('.video-thumb img').attr('src');
  if (!thumbnailUrl) {
    thumbnailUrl = $('meta[property="og:image"]').attr('content') || '';
  }

  // Ana kategori ve alt kategorileri bul
  const mainCategories = new Set();
  // Sadece video-categories sınıfı içindeki ilk 5 kategoriyi al
  $('.video-categories a[href*="/cat/"]').slice(0, 5).each((_, el) => {
    const category = $(el).text().trim();
    if (category && 
        category.length >= 2 && 
        !/\d/.test(category) && 
        !category.includes('@') && 
        !category.includes('.com') &&
        !category.toLowerCase().includes('videos') &&
        !category.toLowerCase().includes('porn')) {
      mainCategories.add(category);
    }
  });

  // Ana oyuncuyu bul (video başlığında geçen)
  const mainActorName = title.split('-')[0].trim();
  const actors = new Set();
  
  // Önce başlıktaki oyuncuyu kontrol et
  if (mainActorName && mainActorName.length >= 3 && 
      !/[@\d]/.test(mainActorName) && 
      !mainActorName.includes('.com') && 
      !mainActorName.includes('Unknown')) {
    actors.add(mainActorName);
  }

  // Eğer başlıkta oyuncu bulunamadıysa, sayfadaki ilk pornstar linkini kontrol et
  if (actors.size === 0) {
    const firstPornstar = $('a[href*="/pornstar/"]').first().text().trim();
    if (firstPornstar && 
        firstPornstar.length >= 3 && 
        !/[@\d]/.test(firstPornstar) && 
        !firstPornstar.includes('.com') && 
        !firstPornstar.includes('Unknown') &&
        !firstPornstar.toLowerCase().includes('user') &&
        !firstPornstar.toLowerCase().includes('content')) {
      actors.add(firstPornstar);
    }
  }

  // Etiketler
  const tags = new Set();
  $('.tags a[href*="/tag/"]').each((_, el) => {
    const tag = $(el).text().trim();
    if (tag && tag.length >= 2) {
      tags.add(tag);
    }
  });

  return {
    title: title || 'Untitled Video',
    description: description || '',
    thumbnailUrl: thumbnailUrl || '',
    categories: Array.from(mainCategories), // Ana kategoriler
    actors: Array.from(actors), // Sadece ana oyuncu
    tags: Array.from(tags)
  };
};

// Video scraping endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL gerekli' });
    }

    // Eporner için özel headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Cookie': 'age_verified=1'
    };

    const response = await axios.get(url, {
      headers: headers,
      responseType: 'text'
    });

    const html = response.data;
    if (typeof html !== 'string') {
      throw new Error('Geçersiz HTML yanıtı');
    }

    const $ = cheerio.load(html);
    const videoInfo = extractVideoInfo($);

    // iframe kodu oluştur
    const videoId = url.match(/video-([^/]+)/)?.[1];
    if (videoId) {
      videoInfo.iframeCode = `<iframe src="https://prnclub-vn.web.app/embed/${videoId}/" frameborder="0" width="100%" height="100%" scrolling="no" allowfullscreen></iframe>`;
    }

    // Eğer hiç kategori bulunamadıysa varsayılan kategori ekle
    if (videoInfo.categories.length === 0) {
      videoInfo.categories = ['Adult'];
    }

    // Eğer hiç oyuncu bulunamadıysa varsayılan oyuncu ekle
    if (videoInfo.actors.length === 0) {
      videoInfo.actors = ['Unknown'];
    }

    res.json(videoInfo);
  } catch (error) {
    console.error('Scraping hatası:', error);
    res.status(500).json({ 
      error: 'Video bilgileri çekilemedi',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
}); 