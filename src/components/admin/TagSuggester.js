import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Popüler etiketler listesi (normalde veritabanından çekilebilir)
const popularTags = [
  "amateur", "anal", "asian", "ass", "bbw", "bdsm", "big ass", "big tits",
  "blonde", "blowjob", "brunette", "casting", "college", "creampie", "cumshot",
  "deepthroat", "double penetration", "ebony", "facial", "fetish", "gangbang",
  "gay", "group", "handjob", "hardcore", "hd", "interracial", "latina", "lesbian",
  "massage", "masturbation", "mature", "milf", "orgy", "outdoor", "pornstar",
  "pov", "public", "reality", "redhead", "rough", "sex", "shemale", "small tits",
  "solo", "squirt", "teen", "threesome", "toys", "vintage", "webcam"
];

const TagSuggester = ({ title, description, onSelectTag }) => {
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularVideoTags, setPopularVideoTags] = useState([]);

  // Popüler etiketleri yükle
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        // En çok görüntülenen 20 videonun etiketlerini al
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, orderBy('viewCount', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        
        // Tüm etiketleri topla
        let allTags = [];
        querySnapshot.docs.forEach(doc => {
          const video = doc.data();
          if (video.tags && Array.isArray(video.tags)) {
            allTags = [...allTags, ...video.tags];
          }
        });
        
        // Etiketlerin sıklığını hesapla
        const tagFrequency = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});
        
        // Sıklığa göre sırala ve en popüler 30 etiketi al
        const sortedTags = Object.entries(tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .map(([tag]) => tag)
          .slice(0, 30);
        
        setPopularVideoTags(sortedTags);
      } catch (error) {
        console.error('Error fetching popular tags:', error);
      }
    };

    fetchPopularTags();
  }, []);

  // Title ve description değiştiğinde etiketleri öner
  useEffect(() => {
    if (!title && !description) {
      setSuggestedTags([]);
      return;
    }

    setLoading(true);
    
    // Metni kelimelere ayır
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 3);
    
    // Popüler etiketlerle eşleşen etiketleri bul
    const matched = popularTags.filter(tag => 
      text.includes(tag.toLowerCase())
    );
    
    // Popüler video etiketleriyle eşleşen etiketleri bul
    const matchedVideoTags = popularVideoTags.filter(tag => 
      text.includes(tag.toLowerCase())
    );
    
    // Tek kelimeler için aday etiketler
    const candidateSingleTags = words.filter(word => 
      word.length > 4 && 
      !matched.includes(word) &&
      !matchedVideoTags.includes(word)
    );
    
    // İki kelimelik etiket adayları
    const candidateDoubleTags = [];
    for (let i = 0; i < words.length - 1; i++) {
      const doubleTag = `${words[i]} ${words[i + 1]}`;
      if (doubleTag.length > 5 && !matched.includes(doubleTag) && !matchedVideoTags.includes(doubleTag)) {
        candidateDoubleTags.push(doubleTag);
      }
    }
    
    // Tüm önerileri birleştir ve tekrarları kaldır
    const allSuggestions = [
      ...matched,
      ...matchedVideoTags,
      ...candidateSingleTags.slice(0, 5),
      ...candidateDoubleTags.slice(0, 3)
    ];
    
    const uniqueSuggestions = Array.from(new Set(allSuggestions));
    
    setSuggestedTags(uniqueSuggestions);
    setLoading(false);
  }, [title, description, popularVideoTags]);

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-white mb-3">Önerilen Etiketler</h3>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {suggestedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => onSelectTag(tag)}
                  className="bg-dark-700 hover:bg-primary-900/30 text-gray-300 hover:text-primary-400 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200"
                >
                  + {tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-2">
              İçerik eklendikçe etiket önerileri görünecek.
            </p>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Popüler Etiketler</h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 15).map((tag, index) => (
                <button
                  key={index}
                  onClick={() => onSelectTag(tag)}
                  className="bg-dark-800 hover:bg-primary-900/20 text-gray-400 hover:text-primary-400 px-2 py-1 rounded text-xs transition-colors duration-200"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TagSuggester; 