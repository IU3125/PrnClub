import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy, getDoc, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  TrashIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  ClockIcon,
  FilmIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const commentsData = [];
        for (const doc of querySnapshot.docs) {
          const commentData = { id: doc.id, ...doc.data() };
          
          // Get user data
          if (commentData.userId) {
            const userDoc = await getDoc(doc(db, 'users', commentData.userId));
            if (userDoc.exists()) {
              commentData.user = userDoc.data();
            }
          }
          
          // Get video data
          if (commentData.videoId) {
            const videoDoc = await getDoc(doc(db, 'videos', commentData.videoId));
            if (videoDoc.exists()) {
              commentData.video = videoDoc.data();
            }
          }
          
          commentsData.push(commentData);
        }
        
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('An error occurred while fetching comments.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Remove comment from list
      setComments(comments.filter(comment => comment.id !== commentId));
      
      setSuccess('Comment deleted successfully.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('An error occurred while deleting the comment.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  // Search filter
  const filteredComments = comments.filter(comment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      comment.content?.toLowerCase().includes(searchLower) ||
      comment.user?.displayName?.toLowerCase().includes(searchLower) ||
      comment.video?.title?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Comment Management</h1>
      
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
      
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search comments... (content, username, video title)"
            className="w-full py-2 pl-10 pr-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {searchQuery ? 'No comments found matching your search criteria.' : 'No comments found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <div key={comment.id} className="bg-dark-700 rounded-lg overflow-hidden p-4">
              <div className="flex items-start">
                {/* User information */}
                <div className="flex-shrink-0">
                  {comment.user?.photoURL ? (
                    <img 
                      src={comment.user.photoURL} 
                      alt={comment.user.displayName} 
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                
                {/* Comment content */}
                <div className="ml-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">
                        {comment.user?.displayName || 'Anonymous User'}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        {comment.user?.email && `(${comment.user.email})`}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-gray-300">
                    {comment.content}
                  </div>
                  
                  {/* Video information */}
                  {comment.video && (
                    <div className="mt-3 flex items-center bg-dark-800 p-2 rounded">
                      <div className="flex-shrink-0 h-12 w-16 relative">
                        {comment.video.thumbnailUrl ? (
                          <img 
                            src={comment.video.thumbnailUrl} 
                            alt={comment.video.title} 
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <div className="h-full w-full bg-dark-600 rounded flex items-center justify-center">
                            <FilmIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-white font-medium">
                          {comment.video.title || 'Video Title Not Available'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Video ID: {comment.videoId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!comment.video && comment.videoId && (
                    <div className="mt-3 flex items-center bg-dark-800 p-2 rounded">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <div className="text-sm text-gray-400">
                        Video Not Found (ID: {comment.videoId.substring(0, 8)}...)
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-400"
                    title="Delete Comment"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments; 