import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SeoAnalyzer = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [seoAnalysis, setSeoAnalysis] = useState(null);

  // Videoları getir
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, orderBy('createdAt', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        
        const videosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setVideos(videosList);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Seçilen videoyu analiz et
  const analyzeSeo = (video) => {
    setSelectedVideo(video);
    
    // Başlık analizi
    const titleScore = analyzeTitleSeo(video.title);
    
    // Açıklama analizi
    const descriptionScore = analyzeDescriptionSeo(video.description);
    
    // Etiket analizi
    const tagsScore = analyzeTagsSeo(video.tags);
    
    // Meta verileri analizi
    const metaScore = analyzeMetaSeo(video);
    
    // Genel puan
    const overallScore = (titleScore.score + descriptionScore.score + tagsScore.score + metaScore.score) / 4;
    
    setSeoAnalysis({
      title: titleScore,
      description: descriptionScore,
      tags: tagsScore,
      meta: metaScore,
      overallScore: Math.round(overallScore),
      suggestions: [
        ...titleScore.suggestions,
        ...descriptionScore.suggestions,
        ...tagsScore.suggestions,
        ...metaScore.suggestions
      ]
    });
  };

  // Başlık SEO analizi
  const analyzeTitleSeo = (title) => {
    if (!title) {
      return {
        score: 0,
        suggestions: ['Video başlığı bulunamadı. Başlık ekleyin.']
      };
    }
    
    const suggestions = [];
    let score = 50; // Başlangıç skoru
    
    // Başlık uzunluğu kontrolü
    if (title.length < 20) {
      score -= 20;
      suggestions.push('Başlık çok kısa. En az 20 karakter olmalı.');
    } else if (title.length > 60) {
      score -= 10;
      suggestions.push('Başlık çok uzun. 60 karakterin altında olması ideal.');
    } else {
      score += 20;
    }
    
    // Anahtar kelime yoğunluğu
    const words = title.toLowerCase().split(' ');
    const wordCount = new Map();
    
    words.forEach(word => {
      if (word.length > 3) { // Kısa kelimeleri sayma
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    const repetitiveWords = Array.from(wordCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([word]) => word);
    
    if (repetitiveWords.length > 0) {
      score -= 10;
      suggestions.push(`Başlıkta tekrar eden kelimeler var: ${repetitiveWords.join(', ')}`);
    } else {
      score += 10;
    }
    
    // Özel karakterler
    if (/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]+/.test(title)) {
      score -= 10;
      suggestions.push('Başlıkta özel karakterler var. Bunlar SEO için ideal değil.');
    } else {
      score += 10;
    }
    
    return {
      score: Math.min(100, Math.max(0, score)), // 0-100 arasında
      suggestions
    };
  };

  // Açıklama SEO analizi
  const analyzeDescriptionSeo = (description) => {
    if (!description) {
      return {
        score: 0,
        suggestions: ['Video açıklaması bulunamadı. Açıklama ekleyin.']
      };
    }
    
    const suggestions = [];
    let score = 50; // Başlangıç skoru
    
    // Açıklama uzunluğu kontrolü
    if (description.length < 50) {
      score -= 30;
      suggestions.push('Açıklama çok kısa. En az 50 karakter olmalı.');
    } else if (description.length < 100) {
      score -= 10;
      suggestions.push('Açıklama kısa. 100-160 karakter arası ideal.');
    } else if (description.length > 160) {
      score -= 5;
      suggestions.push('Açıklama çok uzun. 160 karakterin altında olması ideal.');
    } else {
      score += 30;
    }
    
    // Anahtar kelime yoğunluğu
    const words = description.toLowerCase().split(' ');
    
    if (words.length > 20) {
      score += 20;
    } else {
      score -= 10;
      suggestions.push('Açıklamada daha fazla kelime kullanın.');
    }
    
    return {
      score: Math.min(100, Math.max(0, score)), // 0-100 arasında
      suggestions
    };
  };

  // Etiket SEO analizi
  const analyzeTagsSeo = (tags) => {
    if (!tags || tags.length === 0) {
      return {
        score: 0,
        suggestions: ['Video etiketleri bulunamadı. Etiket ekleyin.']
      };
    }
    
    const suggestions = [];
    let score = 50; // Başlangıç skoru
    
    // Etiket sayısı kontrolü
    if (tags.length < 5) {
      score -= 20;
      suggestions.push('Daha fazla etiket ekleyin. En az 5 etiket olmalı.');
    } else if (tags.length < 10) {
      score -= 10;
      suggestions.push('Daha fazla etiket ekleyin. 10-15 etiket ideal.');
    } else if (tags.length > 20) {
      score -= 5;
      suggestions.push('Çok fazla etiket var. 15-20 arası ideal.');
    } else {
      score += 30;
    }
    
    // Etiket uzunluğu kontrolü
    const shortTags = tags.filter(tag => tag.length < 3);
    if (shortTags.length > 0) {
      score -= 10;
      suggestions.push('Bazı etiketler çok kısa. 3 karakterden uzun olmalı.');
    }
    
    const longTags = tags.filter(tag => tag.length > 20);
    if (longTags.length > 0) {
      score -= 10;
      suggestions.push('Bazı etiketler çok uzun. 20 karakterden kısa olmalı.');
    }
    
    return {
      score: Math.min(100, Math.max(0, score)), // 0-100 arasında
      suggestions
    };
  };

  // Meta veriler SEO analizi
  const analyzeMetaSeo = (video) => {
    const suggestions = [];
    let score = 50; // Başlangıç skoru
    
    // Thumbnail kontrolü
    if (!video.thumbnailUrl) {
      score -= 20;
      suggestions.push('Video thumbnail eksik. Thumbnail ekleyin.');
    } else {
      score += 20;
    }
    
    // Kategori kontrolü
    if (!video.categories || video.categories.length === 0) {
      score -= 10;
      suggestions.push('Video kategorileri eksik. Kategori ekleyin.');
    } else if (video.categories.length < 2) {
      score -= 5;
      suggestions.push('Daha fazla kategori ekleyin. En az 2 kategori olmalı.');
    } else {
      score += 10;
    }
    
    // Oyuncu kontrolü
    if (!video.actors || video.actors.length === 0) {
      score -= 10;
      suggestions.push('Video oyuncuları eksik. Oyuncu ekleyin.');
    } else {
      score += 10;
    }
    
    return {
      score: Math.min(100, Math.max(0, score)), // 0-100 arasında
      suggestions
    };
  };

  const getScoreColor = (score) => {
    if (score < 30) return 'text-red-500';
    if (score < 60) return 'text-yellow-500';
    if (score < 80) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">SEO Analiz Aracı</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video Listesi */}
        <div className="md:col-span-1 bg-dark-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Video Listesi</h2>
          
          {loading ? (
            <p className="text-gray-400">Yükleniyor...</p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              {videos.map(video => (
                <div 
                  key={video.id}
                  onClick={() => analyzeSeo(video)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors ${
                    selectedVideo?.id === video.id ? 'bg-primary-900/30 border border-primary-500/50' : 'bg-dark-700'
                  }`}
                >
                  <h3 className="text-sm font-medium text-white truncate">{video.title}</h3>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <span>{new Date(video.createdAt?.toDate()).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{video.viewCount || 0} görüntüleme</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* SEO Analiz Sonuçları */}
        <div className="md:col-span-2">
          {selectedVideo ? (
            <div className="bg-dark-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">{selectedVideo.title}</h2>
              
              {seoAnalysis && (
                <div className="mt-6">
                  {/* Genel Skor */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white">Genel SEO Skoru:</h3>
                    <div className="flex items-center">
                      <div className={`text-3xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                        {seoAnalysis.overallScore}/100
                      </div>
                    </div>
                  </div>
                  
                  {/* Detaylı Skorlar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Başlık Skoru */}
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">Başlık Skoru</h4>
                        <div className={`text-xl font-bold ${getScoreColor(seoAnalysis.title.score)}`}>
                          {seoAnalysis.title.score}/100
                        </div>
                      </div>
                      <ul className="text-sm space-y-1">
                        {seoAnalysis.title.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-red-400">• {suggestion}</li>
                        ))}
                        {seoAnalysis.title.suggestions.length === 0 && (
                          <li className="text-green-400">• Başlık SEO açısından iyi görünüyor.</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Açıklama Skoru */}
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">Açıklama Skoru</h4>
                        <div className={`text-xl font-bold ${getScoreColor(seoAnalysis.description.score)}`}>
                          {seoAnalysis.description.score}/100
                        </div>
                      </div>
                      <ul className="text-sm space-y-1">
                        {seoAnalysis.description.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-red-400">• {suggestion}</li>
                        ))}
                        {seoAnalysis.description.suggestions.length === 0 && (
                          <li className="text-green-400">• Açıklama SEO açısından iyi görünüyor.</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Etiket Skoru */}
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">Etiket Skoru</h4>
                        <div className={`text-xl font-bold ${getScoreColor(seoAnalysis.tags.score)}`}>
                          {seoAnalysis.tags.score}/100
                        </div>
                      </div>
                      <ul className="text-sm space-y-1">
                        {seoAnalysis.tags.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-red-400">• {suggestion}</li>
                        ))}
                        {seoAnalysis.tags.suggestions.length === 0 && (
                          <li className="text-green-400">• Etiketler SEO açısından iyi görünüyor.</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Meta Veri Skoru */}
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">Meta Veri Skoru</h4>
                        <div className={`text-xl font-bold ${getScoreColor(seoAnalysis.meta.score)}`}>
                          {seoAnalysis.meta.score}/100
                        </div>
                      </div>
                      <ul className="text-sm space-y-1">
                        {seoAnalysis.meta.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-red-400">• {suggestion}</li>
                        ))}
                        {seoAnalysis.meta.suggestions.length === 0 && (
                          <li className="text-green-400">• Meta veriler SEO açısından iyi görünüyor.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Genel Öneriler */}
                  <div className="bg-dark-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">Öneriler</h3>
                    <ul className="text-sm space-y-1">
                      {seoAnalysis.suggestions.length > 0 ? (
                        seoAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-yellow-400">• {suggestion}</li>
                        ))
                      ) : (
                        <li className="text-green-400">• Video SEO açısından iyi görünüyor.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-dark-800 p-6 rounded-lg text-center">
              <p className="text-gray-400">Analiz için bir video seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoAnalyzer; 