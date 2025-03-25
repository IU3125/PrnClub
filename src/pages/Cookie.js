import React from 'react';

const Cookie = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Cookie Policy</h1>
        
        <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-300 mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They help us provide you with a better experience by enabling us to monitor which pages you find useful and which you do not.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Essential Cookies</h3>
                <p className="text-gray-300">
                  These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Analytics Cookies</h3>
                <p className="text-gray-300">
                  We use analytics cookies to help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Preference Cookies</h3>
                <p className="text-gray-300">
                  These cookies enable the website to remember choices you make and provide enhanced, more personal features.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Marketing Cookies</h3>
                <p className="text-gray-300">
                  These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How to Control Cookies</h2>
            <p className="text-gray-300 mb-4">
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-300 mb-4">
              We use services from third parties that may also set cookies on your device. These include:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Google Analytics</li>
              <li>Social media platforms</li>
              <li>Advertising networks</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Cookie Duration</h2>
            <p className="text-gray-300 mb-4">
              The cookies we use have different durations:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Session cookies: These expire when you close your browser</li>
              <li>Persistent cookies: These remain on your device for a set period or until you delete them</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Updates to This Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <div className="bg-dark-700 p-4 rounded-md">
              <p className="text-gray-300">
                PRN Club<br />
                Email: iucin2025@gmail.com
              </p>
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>
                Note: This is a general cookie policy template. We recommend consulting with a legal professional to ensure this policy meets your specific needs and complies with all applicable laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookie; 