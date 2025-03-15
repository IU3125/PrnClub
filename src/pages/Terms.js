import React from 'react';

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Use</h1>
        
        <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using PRN Club, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please do not use our service.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              PRN Club provides a platform for viewing video content through embedded iframe codes from third-party sources. We do not host, upload, or distribute any video content directly.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Conduct</h2>
            <p className="text-gray-300 mb-4">
              Users agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Use the service for any illegal purposes</li>
              <li>Attempt to access restricted areas of the service</li>
              <li>Use any automated system or software to extract data from the service</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Share or distribute any harmful content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-300 mb-4">
              All content on PRN Club, including but not limited to text, graphics, logos, and software, is the property of PRN Club or its content suppliers and is protected by copyright laws.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-gray-300 mb-4">
              The service is provided "as is" without any warranties, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              PRN Club shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Information</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <div className="bg-dark-700 p-4 rounded-md">
              <p className="text-gray-300">
                PRN Club<br />
                Email: support@prnclub.com<br />
                Address: [Your Business Address]
              </p>
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>
                Note: This is a general terms of use template. We recommend consulting with a legal professional to ensure these terms meet your specific needs and comply with all applicable laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms; 