import React from 'react';

const DMCA = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">DMCA Notice & Takedown Procedure</h1>
        
        <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              PRN Club respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement that are reported to our designated copyright agent.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Notice of Infringement</h2>
            <p className="text-gray-300 mb-4">
              If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our copyright agent with the following information:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity</li>
              <li>Your contact information, including your address, telephone number, and email address</li>
              <li>A statement by you that you have a good faith belief that use of the material is not authorized by the copyright owner</li>
              <li>A statement that the information in the notification is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Counter-Notice</h2>
            <p className="text-gray-300 mb-4">
              If you believe that your material has been removed by mistake or misidentification, you can file a counter-notice by providing our copyright agent with the following information:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>Your physical or electronic signature</li>
              <li>Identification of the material that has been removed or to which access has been disabled</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
              <li>Your name, address, and telephone number</li>
              <li>A statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-4">
              Our designated copyright agent for notice of claims of copyright infringement can be reached at:
            </p>
            <div className="bg-dark-700 p-4 rounded-md">
              <p className="text-gray-300">
                DMCA Agent<br />
                PRN Club<br />
                Email: dmca@prnclub.com<br />
                Address: [Your Business Address]
              </p>
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>
                Note: This information is provided for informational purposes only and is not intended as legal advice. For legal advice, please consult an attorney.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMCA; 