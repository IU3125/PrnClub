import React from 'react';
import SEO from '../components/seo/SEO';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Hakkımızda"
        description="PRN Club hakkında bilgi edinin. Misyonumuz, vizyonumuz ve sizlere sunduğumuz yüksek kaliteli video içerik platformu ile tanışın."
        keywords="hakkımızda, PRN Club, video platformu, misyon, vizyon"
        canonicalUrl={`${window.location.origin}/about`}
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">About PRN Club</h1>
        
        <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              Welcome to PRN Club, your premier destination for high-quality video content. We are committed to providing our users with the best viewing experience while maintaining the highest standards of content quality and user privacy.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              Our mission is to create a safe, reliable, and user-friendly platform that connects viewers with their favorite content. We strive to maintain a community-driven environment where users can discover and enjoy content that matters to them.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>High-quality video content</li>
              <li>User-friendly interface</li>
              <li>Regular content updates</li>
              <li>Safe and secure browsing experience</li>
              <li>Community engagement features</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Commitment</h2>
            <p className="text-gray-300 mb-4">
              We are committed to providing a platform that respects user privacy, maintains content quality, and follows all applicable laws and regulations. Our team works tirelessly to ensure the best possible experience for our users.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions or concerns, please don't hesitate to contact us through our contact page. We value your feedback and are always here to help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 