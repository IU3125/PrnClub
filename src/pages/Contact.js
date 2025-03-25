import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState({ status: null, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult({ status: null, message: '' });

    try {
      // Save message directly to Firestore
      const docRef = await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        timestamp: serverTimestamp(),
        read: false
      });

      console.log('Message saved with ID:', docRef.id);
      
      setSubmitResult({
        status: 'success',
        message: 'Thank you! Your message has been sent successfully.'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Contact submission error:', error);
      setSubmitResult({
        status: 'error',
        message: error.message || 'Something went wrong. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Email</h3>
                <p className="text-gray-300">iucin2025@gmail.com</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Response Time</h3>
                <p className="text-gray-300">We typically respond within 24-48 hours</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Business Hours</h3>
                <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-dark-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Send us a Message</h2>
            
            {submitResult.status === 'success' ? (
              <div className="bg-green-900/50 border border-green-500 text-green-200 rounded-md p-4 mb-4">
                {submitResult.message}
              </div>
            ) : submitResult.status === 'error' ? (
              <div className="bg-red-900/50 border border-red-500 text-red-200 rounded-md p-4 mb-4">
                {submitResult.message}
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className={`w-full ${isSubmitting ? 'bg-primary-400' : 'bg-primary-500 hover:bg-primary-600'} text-white py-2 px-4 rounded-md transition-colors duration-200`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 