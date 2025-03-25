const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// CORS ayarlarını güncelle - tüm originlere izin ver
app.use(cors({
  origin: true, // Tüm originlere izin ver
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

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

  // Ana oyuncuyu bul
  const mainActorName = title.split('-')[0].trim();
  const actors = new Set();
  
  if (mainActorName && mainActorName.length >= 3 && 
      !/[@\d]/.test(mainActorName) && 
      !mainActorName.includes('.com') && 
      !mainActorName.includes('Unknown')) {
    actors.add(mainActorName);
  }

  if (actors.size === 0) {
    const firstPornstar = $('a[href*="/pornstar/"]').first().text().trim();
    if (firstPornstar && 
        firstPornstar.length >= 3 && 
        !/[@\d]/.test(firstPornstar) && 
        !firstPornstar.includes('.com') && 
        !firstPornstar.includes('Unknown')) {
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
    categories: Array.from(mainCategories),
    actors: Array.from(actors),
    tags: Array.from(tags)
  };
};

// Video scraping endpoint
app.get('/scrape', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL gerekli' });
    }

    console.log('Scraping URL:', url); // Debug için log

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
      responseType: 'text',
      timeout: 30000, // 30 saniye timeout
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // 500'den küçük tüm statusları kabul et
      }
    });

    if (!response.data) {
      throw new Error('Boş yanıt alındı');
    }

    const html = response.data;
    if (typeof html !== 'string') {
      throw new Error('Geçersiz HTML yanıtı');
    }

    const $ = cheerio.load(html);
    const videoInfo = extractVideoInfo($);

    // iframe kodu oluştur
    const videoId = url.match(/video-([^/]+)/)?.[1];
    if (videoId) {
      videoInfo.iframeCode = `<iframe src="https://www.eporner.com/embed/${videoId}/" frameborder="0" width="100%" height="100%" scrolling="no" allowfullscreen></iframe>`;
    }

    // Varsayılan değerler
    if (videoInfo.categories.length === 0) {
      videoInfo.categories = ['Adult'];
    }
    if (videoInfo.actors.length === 0) {
      videoInfo.actors = ['Unknown'];
    }

    console.log('Scraping successful:', videoInfo.title); // Debug için log
    res.json(videoInfo);
  } catch (error) {
    console.error('Scraping hatası:', error.message);
    console.error('Stack trace:', error.stack); // Detaylı hata bilgisi
    
    let errorMessage = 'Video bilgileri çekilemedi';
    if (error.response) {
      // Axios hata detayları
      errorMessage += ` - Status: ${error.response.status}`;
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      url: req.query.url // Hangi URL'de hata olduğunu görmek için
    });
  }
});

// Contact form submission endpoint
app.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // Store the message in Firestore
    const db = admin.firestore();
    const contactRef = db.collection('contactMessages');
    
    await contactRef.add({
      name,
      email,
      subject,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    // You can implement actual email sending here using nodemailer or similar
    // For now, we'll just log it and store in Firestore
    console.log(`New contact message from ${name} (${email}): ${subject}`);
    
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Express app'i Firebase Cloud Function olarak export et
exports.proxy = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB'
}).https.onRequest(app); 