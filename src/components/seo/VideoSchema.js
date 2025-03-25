import React from 'react';
import { Helmet } from 'react-helmet-async';

const VideoSchema = ({ video }) => {
  if (!video) return null;
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description || `${video.title} - PRN Club video`,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.createdAt ? new Date(video.createdAt.toDate()).toISOString() : new Date().toISOString(),
    "duration": video.duration || "PT10M", // Default 10 dakika
    "contentUrl": `https://www.prnclub.com/video/${video.id}`,
    "embedUrl": `https://www.prnclub.com/embed/${video.id}`,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": video.viewCount || 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": video.likeCount || 0
      }
    ],
    "author": {
      "@type": "Person",
      "name": video.uploadedBy || "PRN Club"
    },
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://www.prnclub.com/video/${video.id}`
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default VideoSchema; 