import React, { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is PRN Club?",
      answer: "PRN Club is a platform that provides high-quality video content through embedded iframe codes from third-party sources. We aim to offer a safe and user-friendly environment for content discovery."
    },
    {
      question: "How do I use the platform?",
      answer: "Simply browse through our categories, find content you're interested in, and click to view. All content is embedded directly on our platform for your convenience."
    },
    {
      question: "Is the content free to watch?",
      answer: "Yes, all content on PRN Club is free to watch. We do not charge any fees for accessing our content."
    },
    {
      question: "How often is new content added?",
      answer: "We regularly update our content library with new videos. The frequency of updates varies depending on the category and content availability."
    },
    {
      question: "Is my privacy protected?",
      answer: "Yes, we take your privacy seriously. We do not collect personal information beyond what's necessary for the platform to function. Please refer to our Privacy Policy for more details."
    },
    {
      question: "How can I report inappropriate content?",
      answer: "If you encounter any inappropriate content, please use our contact form to report it. We review all reports and take appropriate action."
    },
    {
      question: "What browsers are supported?",
      answer: "PRN Club works best on modern browsers like Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
    },
    {
      question: "Do you have a mobile app?",
      answer: "Currently, we don't have a dedicated mobile app, but our website is fully responsive and works well on all mobile devices."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h1>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-dark-800 rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-dark-700 transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                <span className="text-white">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              
              {openIndex === index && (
                <div className="px-6 py-4 bg-dark-700">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-300">
            Still have questions? Please visit our{' '}
            <a href="/contact" className="text-primary-400 hover:text-primary-500">
              Contact page
            </a>{' '}
            to get in touch with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 