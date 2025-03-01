import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { UserCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const CommentSection = ({ videoId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();

  // Yorumları getir
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const commentsQuery = query(
          collection(db, 'comments'),
          where('videoId', '==', videoId),
          orderBy('createdAt', 'desc')
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsList = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setComments(commentsList);
      } catch (error) {
        console.error('Yorumlar getirilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [videoId]);

  // Yorum ekle
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Yorum yapmak için giriş yapmalısınız.');
      return;
    }
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      const commentData = {
        videoId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonim',
        content: newComment,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Yeni yorumu listeye ekle
      setComments([
        {
          id: docRef.id,
          ...commentData,
          createdAt: new Date() // serverTimestamp() yerine geçici olarak
        },
        ...comments
      ]);
      
      setNewComment('');
    } catch (error) {
      console.error('Yorum eklenirken hata oluştu:', error);
    }
  };

  // Yorum sil
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Yorumu listeden kaldır
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Yorum silinirken hata oluştu:', error);
    }
  };

  // Tarih biçimlendirme
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  };

  // Kullanıcının yorumu silme yetkisi var mı?
  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    
    // Admin her yorumu silebilir
    if (userRole === 'admin') return true;
    
    // Kullanıcı kendi yorumunu silebilir
    return comment.userId === currentUser.uid;
  };

  return (
    <div className="bg-dark-700 rounded-lg p-4">
      <h3 className="text-xl font-semibold text-white mb-4">Yorumlar ({comments.length})</h3>
      
      {/* Yorum formu */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <UserCircleIcon className="w-10 h-10 text-gray-400" />
            </div>
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorum yaz..."
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                disabled={!newComment.trim()}
              >
                Yorum Yap
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-dark-800 rounded-md text-center">
          <p className="text-gray-400">Yorum yapmak için giriş yapmalısınız.</p>
        </div>
      )}
      
      {/* Yorumlar listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3 p-3 bg-dark-800 rounded-md">
              <div className="flex-shrink-0">
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white">{comment.userName}</h4>
                    <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500"
                      title="Yorumu Sil"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-gray-300">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
      )}
    </div>
  );
};

export default CommentSection; 