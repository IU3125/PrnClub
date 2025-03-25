import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords = '', 
  ogImage = '', 
  ogType = 'website', 
  canonicalUrl = '',
  twitterCard = 'summary_large_image'
}) => {
  // Site adını ekleyelim
  const siteName = 'PRN Club';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  
  return (
    <Helmet>
      {/* Temel Meta Etiketleri */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph Meta Etiketleri (Facebook, LinkedIn) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Meta Etiketleri */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export default SEO; 