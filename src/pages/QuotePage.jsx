import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Layout from '../components/layout/Layout';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { config } from '../data/config';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const SUBJECT_LABELS = {
  'service-details': 'Service Details',
  'service-status': 'Service Status',
  'general-inquiry': 'General Inquiry',
  transcription: 'Transcription',
};

export default function QuotePage() {
  const animationRef = useScrollAnimation();

  useEffect(() => {
    document.title = 'Get Quote - DigiScribe Transcription Corp.';
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'service-details',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) {
      setError('Email and message are required.');
      return;
    }

    const missingEnv = [
      !EMAILJS_SERVICE_ID ? 'VITE_EMAILJS_SERVICE_ID' : null,
      !EMAILJS_TEMPLATE_ID ? 'VITE_EMAILJS_TEMPLATE_ID' : null,
      !EMAILJS_PUBLIC_KEY ? 'VITE_EMAILJS_PUBLIC_KEY' : null,
    ].filter(Boolean);

    if (missingEnv.length > 0) {
      setError(`Quote form is not configured. Missing: ${missingEnv.join(', ')}.`);
      return;
    }

    setLoading(true);
    setError(null);

    const templateParams = {
      first_name: form.firstName,
      last_name: form.lastName,
      from_name: `${form.firstName} ${form.lastName}`.trim() || form.email,
      email: form.email,
      from_email: form.email,
      phone: form.phone,
      subject: SUBJECT_LABELS[form.subject] || form.subject,
      message: form.message,
      contact_number: form.phone,
      reply_to: form.email,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, {
        publicKey: EMAILJS_PUBLIC_KEY,
      });

      setSuccess(true);
      setForm({ firstName: '', lastName: '', email: '', phone: '', subject: 'service-details', message: '' });
    } catch (err) {
      const rawError = err?.text || err?.message || 'Unable to send message right now. Please try again.';
      const hasTemplateError = /template id not found/i.test(String(rawError));
      if (hasTemplateError) {
        setError(`EmailJS template mismatch. Check VITE_EMAILJS_TEMPLATE_ID (current: ${EMAILJS_TEMPLATE_ID}) and VITE_EMAILJS_SERVICE_ID (current: ${EMAILJS_SERVICE_ID}), then restart the dev server.`);
      } else {
        setError(rawError);
      }
    } finally {
      setLoading(false);
    }
  };

  const heroContent = (
    <main className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-semibold gradient-text text-center mb-10">Get Quote</h1>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Contact Information Card */}
            <div className="lg:w-2/5 relative overflow-hidden min-h-[320px] lg:min-h-[520px] rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}>
              {/* Decorative wave pattern overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
                <svg className="w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="none">
                  <path d="M0,100 Q100,150 200,100 T400,100 L400,600 L0,600 Z" fill="white" />
                  <path d="M0,200 Q100,250 200,200 T400,200 L400,600 L0,600 Z" fill="white" opacity="0.5" />
                  <path d="M0,300 Q100,350 200,300 T400,300 L400,600 L0,600 Z" fill="white" opacity="0.3" />
                </svg>
              </div>

              <div className="relative z-10 p-8 lg:p-10 text-white">
                <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                <p className="text-cyan-100 text-sm mb-10">Contact us now!</p>

                <div className="space-y-8">
                  {/* Phone */}
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <i className="fas fa-phone text-white text-lg"></i>
                    </div>
                    <div>
                      <p className="text-cyan-100 text-xs mb-1">Call Us</p>
                      <span className="text-white font-medium">{config.contact.phone}</span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <i className="fas fa-envelope text-white text-lg"></i>
                    </div>
                    <div>
                      <p className="text-cyan-100 text-xs mb-1">Email Us</p>
                      <span className="text-white font-medium text-sm">{config.contact.email}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <i className="fas fa-map-marker-alt text-white text-lg"></i>
                    </div>
                    <div>
                      <p className="text-cyan-100 text-xs mb-1">Visit Us</p>
                      <span className="text-white font-medium text-sm leading-relaxed">
                        {config.contact.address.line1}<br />
                        {config.contact.address.line2}<br />
                        {config.contact.address.line3}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="mt-12 pt-8 border-t border-white/20">
                  <p className="text-cyan-100 text-xs mb-4">Follow Us</p>
                  <div className="flex gap-3">
                    <a href={config.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-300">
                      <i className="fab fa-linkedin-in text-white"></i>
                    </a>
                    <a href={config.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-300">
                      <i className="fab fa-facebook-f text-white"></i>
                    </a>
                  </div>
                </div>
              </div>

              {/* Decorative circles */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full pointer-events-none" aria-hidden="true"></div>
              <div className="absolute bottom-24 right-8 w-24 h-24 bg-cyan-300/20 rounded-full blur-xl pointer-events-none" aria-hidden="true"></div>
              <div className="absolute top-20 -left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true"></div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-3/5 p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-white to-sky-50/30 relative z-10 rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-dark-text mb-2">Send us a Message</h3>
                <p className="text-sm text-gray-text">Fill out the form below and we'll get back to you shortly.</p>
              </div>

              {success ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-check-circle text-green-500 text-3xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-dark-text mb-2">Message Sent!</h4>
                  <p className="text-sm text-gray-text mb-6">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                      <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-dark-text mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-text mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Email & Contact Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-dark-text mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-text mb-2">Contact Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+63 XXX XXX XXXX"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label className="block text-xs font-medium text-dark-text mb-4">Select Subject</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'service-details', label: 'Service Details' },
                        { value: 'service-status', label: 'Service Status' },
                        { value: 'general-inquiry', label: 'General Inquiry' },
                        { value: 'transcription', label: 'Transcription' },
                      ].map((opt) => (
                        <label key={opt.value} className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="subject"
                            value={opt.value}
                            checked={form.subject === opt.value}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="px-4 py-2.5 rounded-lg border-2 border-gray-200 text-center text-xs text-gray-600 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:border-primary/50">
                            {opt.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-dark-text mb-2">Message <span className="text-red-500">*</span></label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Write your message here..."
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-white"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-gradient text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 flex items-center gap-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <><i className="fas fa-spinner fa-spin text-sm"></i><span>Sending...</span></>
                      ) : (
                        <><span>Send Message</span><i className="fas fa-paper-plane"></i></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <Layout heroContent={heroContent}>
      <div ref={animationRef}>
        {/* No content below the hero for this page */}
      </div>
    </Layout>
  );
}
