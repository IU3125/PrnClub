import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { 
  TrashIcon, 
  PencilIcon, 
  PlusIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Advertisement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Yeni reklam için state
  const [newAd, setNewAd] = useState({
    title: '',
    link: '',
    position: 'sidebar', // sidebar, header, footer, video-before, video-after
    active: true
  });
  const [adImage, setAdImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Düzenleme için state
  const [editingAd, setEditingAd] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    link: '',
    position: '',
    active: true,
    imageUrl: ''
  });
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  // Reklamları getir
  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      try {
        const adsQuery = query(
          collection(db, 'advertisements'),
          orderBy('createdAt', 'desc')
        );
        
        const adsSnapshot = await getDocs(adsQuery);
        const adsList = adsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAds(adsList);
      } catch (error) {
        console.error('Reklamlar getirilirken hata oluştu:', error);
        setError('Reklamlar getirilirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Resim önizleme
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Düzenleme için resim önizleme
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Yeni reklam ekle
  const handleAddAd = async (e) => {
    e.preventDefault();
    
    if (!newAd.title.trim() || !newAd.link.trim() || !adImage) {
      setError('Lütfen tüm alanları doldurun ve bir resim seçin.');
      return;
    }
    
    setLoading(true);
    try {
      // Resmi yükle
      const storageRef = ref(storage, `advertisements/${Date.now()}_${adImage.name}`);
      await uploadBytes(storageRef, adImage);
      const imageUrl = await getDownloadURL(storageRef);
      
      // Reklam verisini oluştur
      const adData = {
        ...newAd,
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Firestore'a ekle
      const docRef = await addDoc(collection(db, 'advertisements'), adData);
      
      // State'i güncelle
      setAds([
        {
          id: docRef.id,
          ...adData
        },
        ...ads
      ]);
      
      // Formu temizle
      setNewAd({
        title: '',
        link: '',
        position: 'sidebar',
        active: true
      });
      setAdImage(null);
      setImagePreview('');
      
      setSuccess('Reklam başarıyla eklendi.');
    } catch (error) {
      console.error('Reklam eklenirken hata oluştu:', error);
      setError('Reklam eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme modunu aç
  const handleEditMode = (ad) => {
    setEditingAd(ad.id);
    setEditForm({
      title: ad.title,
      link: ad.link,
      position: ad.position,
      active: ad.active,
      imageUrl: ad.imageUrl
    });
    setNewImagePreview('');
    setNewImage(null);
  };

  // Reklam güncelle
  const handleUpdateAd = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim() || !editForm.link.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    
    setLoading(true);
    try {
      let imageUrl = editForm.imageUrl;
      
      // Eğer yeni resim yüklendiyse
      if (newImage) {
        // Eski resmi sil
        try {
          const oldImageRef = ref(storage, editForm.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error('Eski resim silinirken hata oluştu:', error);
        }
        
        // Yeni resmi yükle
        const storageRef = ref(storage, `advertisements/${Date.now()}_${newImage.name}`);
        await uploadBytes(storageRef, newImage);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Reklam verisini güncelle
      const adData = {
        title: editForm.title,
        link: editForm.link,
        position: editForm.position,
        active: editForm.active,
        imageUrl,
        updatedAt: new Date()
      };
      
      // Firestore'da güncelle
      await updateDoc(doc(db, 'advertisements', editingAd), adData);
      
      // State'i güncelle
      setAds(ads.map(ad => 
        ad.id === editingAd 
          ? { ...ad, ...adData } 
          : ad
      ));
      
      // Düzenleme modunu kapat
      setEditingAd(null);
      setNewImage(null);
      setNewImagePreview('');
      
      setSuccess('Reklam başarıyla güncellendi.');
    } catch (error) {
      console.error('Reklam güncellenirken hata oluştu:', error);
      setError('Reklam güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Reklam sil
  const handleDeleteAd = async (adId, imageUrl) => {
    if (!window.confirm('Bu reklamı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Firestore'dan sil
      await deleteDoc(doc(db, 'advertisements', adId));
      
      // Storage'dan resmi sil
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Resim silinirken hata oluştu:', error);
      }
      
      // State'i güncelle
      setAds(ads.filter(ad => ad.id !== adId));
      
      setSuccess('Reklam başarıyla silindi.');
    } catch (error) {
      console.error('Reklam silinirken hata oluştu:', error);
      setError('Reklam silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Pozisyon adını formatla
  const formatPosition = (position) => {
    switch (position) {
      case 'sidebar': return 'Kenar Çubuğu';
      case 'header': return 'Üst Kısım';
      case 'footer': return 'Alt Kısım';
      case 'video-before': return 'Video Öncesi';
      case 'video-after': return 'Video Sonrası';
      default: return position;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Reklam Yönetimi</h1>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Reklam ekleme formu */}
      <div className="bg-dark-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Yeni Reklam Ekle</h2>
        
        <form onSubmit={handleAddAd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 mb-2">Reklam Başlığı</label>
              <input
                type="text"
                className="input w-full"
                value={newAd.title}
                onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">Reklam Linki</label>
              <input
                type="url"
                className="input w-full"
                value={newAd.link}
                onChange={(e) => setNewAd({...newAd, link: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">Pozisyon</label>
              <select
                className="input w-full"
                value={newAd.position}
                onChange={(e) => setNewAd({...newAd, position: e.target.value})}
              >
                <option value="sidebar">Kenar Çubuğu</option>
                <option value="header">Üst Kısım</option>
                <option value="footer">Alt Kısım</option>
                <option value="video-before">Video Öncesi</option>
                <option value="video-after">Video Sonrası</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">Durum</label>
              <select
                className="input w-full"
                value={newAd.active}
                onChange={(e) => setNewAd({...newAd, active: e.target.value === 'true'})}
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Reklam Görseli</label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-dark-600 hover:bg-dark-500 text-white py-2 px-4 rounded flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Görsel Seç
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
              </label>
              {imagePreview && (
                <div className="ml-4">
                  <img src={imagePreview} alt="Önizleme" className="h-16 rounded" />
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="h-5 w-5 mr-2" />
            )}
            Reklam Ekle
          </button>
        </form>
      </div>
      
      {/* Reklam listesi */}
      {loading && !editingAd ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : ads.length > 0 ? (
        <div className="bg-dark-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-600">
              <thead className="bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Görsel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Başlık</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pozisyon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-dark-600">
                    {editingAd === ad.id ? (
                      <td colSpan="5" className="px-6 py-4">
                        <form onSubmit={handleUpdateAd}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-gray-400 mb-2">Reklam Başlığı</label>
                              <input
                                type="text"
                                className="input w-full"
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Reklam Linki</label>
                              <input
                                type="url"
                                className="input w-full"
                                value={editForm.link}
                                onChange={(e) => setEditForm({...editForm, link: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Pozisyon</label>
                              <select
                                className="input w-full"
                                value={editForm.position}
                                onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                              >
                                <option value="sidebar">Kenar Çubuğu</option>
                                <option value="header">Üst Kısım</option>
                                <option value="footer">Alt Kısım</option>
                                <option value="video-before">Video Öncesi</option>
                                <option value="video-after">Video Sonrası</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Durum</label>
                              <select
                                className="input w-full"
                                value={editForm.active}
                                onChange={(e) => setEditForm({...editForm, active: e.target.value === 'true'})}
                              >
                                <option value="true">Aktif</option>
                                <option value="false">Pasif</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-400 mb-2">Reklam Görseli</label>
                            <div className="flex items-center">
                              <label className="cursor-pointer bg-dark-600 hover:bg-dark-500 text-white py-2 px-4 rounded flex items-center">
                                <PhotoIcon className="h-5 w-5 mr-2" />
                                Görsel Değiştir
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleEditImageChange}
                                />
                              </label>
                              <div className="ml-4">
                                <img 
                                  src={newImagePreview || editForm.imageUrl} 
                                  alt="Önizleme" 
                                  className="h-16 rounded" 
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              className="btn btn-primary flex items-center"
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                              ) : (
                                <PencilIcon className="h-5 w-5 mr-2" />
                              )}
                              Güncelle
                            </button>
                            
                            <button
                              type="button"
                              className="btn btn-secondary flex items-center"
                              onClick={() => setEditingAd(null)}
                            >
                              <XMarkIcon className="h-5 w-5 mr-2" />
                              İptal
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={ad.imageUrl} alt={ad.title} className="h-12 rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{ad.title}</div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <a 
                              href={ad.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary-500 flex items-center"
                            >
                              {ad.link.substring(0, 30)}...
                              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-dark-600 text-white">
                            {formatPosition(ad.position)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ad.active 
                              ? 'bg-green-500 bg-opacity-20 text-green-500' 
                              : 'bg-red-500 bg-opacity-20 text-red-500'
                          }`}>
                            {ad.active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditMode(ad)}
                            className="text-primary-500 hover:text-primary-400 mr-3"
                            title="Düzenle"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id, ad.imageUrl)}
                            className="text-red-500 hover:text-red-400"
                            title="Sil"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Henüz hiç reklam bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
};

export default Advertisement; 