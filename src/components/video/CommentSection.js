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
import { enUS } from 'date-fns/locale';
import { UserCircleIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const CommentSection = ({ videoId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();

  // Fetch comments
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
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [videoId]);

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('You must be logged in to comment.');
      return;
    }
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      const commentData = {
        videoId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        content: newComment,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Add new comment to the list
      setComments([
        {
          id: docRef.id,
          ...commentData,
          createdAt: new Date() // Temporary replacement for serverTimestamp()
        },
        ...comments
      ]);
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Remove comment from the list
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
  };

  // Check if user can delete comment
  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    
    // Admin can delete any comment
    if (userRole === 'admin') return true;
    
    // User can delete their own comment
    return comment.userId === currentUser.uid;
  };

  return (
    <div className="bg-dark-700 rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <ChatBubbleLeftIcon className="w-6 h-6 text-primary-400 mr-2" />
        <h3 className="text-xl font-semibold text-white">Comments <span className="text-primary-400 text-lg ml-1">({comments.length})</span></h3>
      </div>
      
      {/* Comment form */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-primary-300" />
              </div>
            </div>
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white transition-all duration-200 resize-none"
                rows="3"
              ></textarea>
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center"
                  disabled={!newComment.trim()}
                >
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                  Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-5 bg-dark-800 rounded-lg border border-dark-600 text-center">
          <p className="text-gray-300">You must be logged in to comment.</p>
        </div>
      )}
      
      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-5">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-4 p-4 bg-dark-800 rounded-lg border border-dark-600 hover:border-dark-500 transition-all duration-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-800 flex items-center justify-center">
                  <UserCircleIcon className="w-10 h-10 text-primary-300" />
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white text-base">{comment.userName}</h4>
                    <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                  </div>
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-dark-700"
                      title="Delete Comment"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-gray-200 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-dark-800 rounded-lg border border-dashed border-dark-600">
          <ChatBubbleLeftIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection; 