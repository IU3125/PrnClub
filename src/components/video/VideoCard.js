import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

const VideoCard = ({ video }) => {
  // Video süresini biçimlendir (saniye cinsinden)
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // İzlenme sayısını biçimlendir
  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Tarih biçimlendirme
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  };

  return (
    <div className="card group hover:shadow-lg transition-all duration-300">
      <Link to={`/video/${video.id}`} className="block relative">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Süre etiketi */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            <span className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>
        
        {/* Video bilgileri */}
        <div className="p-3">
          <h3 className="text-white font-medium line-clamp-2 group-hover:text-primary-400 transition-colors">
            {video.title}
          </h3>
          
          <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
            <span>{video.uploader}</span>
            <div className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span>{formatViewCount(video.viewCount)}</span>
            </div>
          </div>
          
          <div className="mt-1 text-xs text-gray-500">
            {formatDate(video.createdAt)}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard; 