import React from 'react';

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        
        <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information that you provide directly to us when using PRN Club, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Contact information (if you choose to provide it)</li>
              <li>Usage data and analytics</li>
              <li>Device information</li>
              <li>IP address and location data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Provide and maintain our service</li>
              <li>Improve user experience</li>
              <li>Analyze usage patterns</li>
              <li>Respond to your requests</li>
              <li>Protect against fraud and abuse</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-300 mb-4">
              We do not sell or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Service providers who assist in our operations</li>
              <li>Law enforcement when required by law</li>
              <li>Third parties with your consent</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Cookies and Tracking</h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Remember your preferences</li>
              <li>Analyze site usage</li>
              <li>Improve our service</li>
              <li>Provide personalized content</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to data processing</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Changes to Privacy Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-dark-700 p-4 rounded-md">
              <p className="text-gray-300">
                PRN Club<br />
                Email: iucin2025@gmail.com
              </p>
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>
                Note: This is a general privacy policy template. We recommend consulting with a legal professional to ensure this policy meets your specific needs and complies with all applicable privacy laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 