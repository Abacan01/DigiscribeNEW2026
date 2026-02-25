import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCarousel } from '../hooks/useCarousel';
import { config } from '../data/config';

export default function HomePage() {
  const animationRef = useScrollAnimation();
  const awardsData = config.images.awardsCarousel || [];
  const {
    currentSlide,
    next,
    prev,
    goTo,
    getSlideClass,
    handlers,
    resetAutoPlay,
  } = useCarousel(awardsData.length, 2000);

  useEffect(() => {
    document.title = 'Home - DigiScribe Transcription Corp.';
  }, []);

  const heroContent = (
    <section className="py-12 lg:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="lg:w-1/2 z-10">
            <h1 className="text-4xl md:text-5xl lg:text-[52px] font-bold text-dark-text leading-tight mb-6">
              <span className="text-primary">Reliable</span> Medical Transcription &amp; Back-Office Support
            </h1>
            <p className="text-gray-text text-sm mb-8 leading-relaxed max-w-md">
              We help healthcare providers reduce workload, improve accuracy, and streamline revenue with secure, <span className="text-primary">HIPAA compliant</span> support services.
            </p>
            <a href="#services" className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-medium transition-all hover:shadow-lg" style={{ background: 'linear-gradient(90deg, #b8e4f7 0%, #0ea5e9 50%, #0369a1 100%)' }}>
              Our Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Right Image with decorative elements */}
          <div className="lg:w-1/2 relative flex justify-center pb-20">
            {/* Light blue gradient background circle */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[350px] h-[350px] lg:w-[450px] lg:h-[450px] rounded-full hidden md:block" style={{ background: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #38bdf8 100%)' }}></div>

            {/* Dashed circle decoration */}
            <div className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 w-[380px] h-[380px] lg:w-[480px] lg:h-[480px] dashed-circle hidden lg:block"></div>

            {/* Doctor Image */}
            <div className="relative z-10">
              <img src="/images/doctorhome.png" alt="Medical Professional with Headset" className="w-full max-w-sm mx-auto lg:max-w-md object-contain" />

              {/* Tooltip Box with quote marks - centered at bottom */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg p-4 w-[280px] z-20">
                {/* Blue quotation marks */}
                <div className="absolute -top-5 left-4">
                  <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-text leading-relaxed pt-3">
                  From data entry to revenue cycle management, Digiscribe delivers accurate, scalable healthcare support—24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute left-10 top-1/3 hidden lg:block">
        <div className="grid grid-cols-3 gap-2">
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
        </div>
      </div>
    </section>
  );

  return (
    <Layout heroContent={heroContent}>
      <div ref={animationRef}>
        {/* Awards & Recognition Section with Carousel */}
        <section className="py-12 bg-white relative section-fade-to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">
              <span className="gradient-text">Awards</span> <span className="gradient-text">&amp;</span> <span className="gradient-text">Recognition</span>
            </h2>

            {/* Carousel Container */}
            <div className="relative max-w-4xl mx-auto carousel-container" {...handlers}>
              {/* Carousel Track */}
              <div className="carousel-track">
                {awardsData.map((award, index) => (
                  <div
                    key={index}
                    className={`carousel-slide ${getSlideClass(index)}`}
                    data-index={index}
                  >
                    <img src={award.src} alt={award.alt} className="carousel-img" />
                  </div>
                ))}
              </div>

              {/* Carousel Navigation - Arrows and Dots */}
              <div className="flex justify-center items-center gap-4 mt-8">
                {/* Prev Arrow */}
                <button
                  className="carousel-arrow prev"
                  aria-label="Previous slide"
                  onClick={() => { prev(); resetAutoPlay(); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="flex gap-2">
                  {awardsData.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot rounded-full ${index === currentSlide ? 'active' : 'bg-gray-300'}`}
                      style={{
                        width: index === currentSlide ? '24px' : '12px',
                        height: '12px',
                        background: index === currentSlide
                          ? 'linear-gradient(90deg, #61d0ff 0%, #0ea5e9 50%, #0369a1 100%)'
                          : '#d1d5db',
                        transition: 'all 0.3s ease',
                      }}
                      data-slide={index}
                      onClick={() => {
                        if (index !== currentSlide) {
                          goTo(index);
                          resetAutoPlay();
                        }
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Next Arrow */}
                <button
                  className="carousel-arrow next"
                  aria-label="Next slide"
                  onClick={() => { next(); resetAutoPlay(); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 relative overflow-hidden section-fade-to-blue">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-sky-50/50 to-cyan-50/30"></div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Floating gradient orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-200/30 to-sky-300/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-sky-100/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          {/* Wave decoration top left */}
          <div className="absolute top-8 left-8 hidden md:block z-0 pointer-events-none">
            <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15 Q 15 5, 30 15 T 60 15 T 90 15 T 120 15" stroke="#7dd3fc" strokeWidth="2" fill="none" />
              <path d="M0 30 Q 15 20, 30 30 T 60 30 T 90 30 T 120 30" stroke="#38bdf8" strokeWidth="2" fill="none" />
              <path d="M0 45 Q 15 35, 30 45 T 60 45 T 90 45 T 120 45" stroke="#0ea5e9" strokeWidth="2" fill="none" />
            </svg>
          </div>

          {/* Wave decoration bottom right */}
          <div className="absolute bottom-8 right-8 hidden md:block z-0 pointer-events-none">
            <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15 Q 15 5, 30 15 T 60 15 T 90 15 T 120 15" stroke="#7dd3fc" strokeWidth="2" fill="none" />
              <path d="M0 30 Q 15 20, 30 30 T 60 30 T 90 30 T 120 30" stroke="#38bdf8" strokeWidth="2" fill="none" />
              <path d="M0 45 Q 15 35, 30 45 T 60 45 T 90 45 T 120 45" stroke="#0ea5e9" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-dark-text mb-4">
                <span className="gradient-text">Core Services</span>
              </h2>
              <p className="text-gray-text text-sm max-w-2xl mx-auto">
                Professional business support services to streamline your operations
              </p>
            </div>

            {/* Services Grid - Top Row (2 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-6">
              {/* Service 1: Transcription Support */}
              <Link to="/services/transcription" className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-cyan-100/50 border border-white/50 transition-all duration-500 block hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 hover:bg-white overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-cyan-200/50 group-hover:shadow-cyan-300/60 transition-all duration-300 group-hover:scale-110">
                    <i className="fas fa-headset text-white text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-dark-text mb-3 group-hover:text-cyan-600 transition-colors">Transcription Support</h3>
                  <p className="text-sm text-gray-text leading-relaxed">Converting audio and video files into accurate text documents with fast turnaround and quality assurance.</p>
                  <div className="mt-4 flex items-center gap-2 text-cyan-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>Learn More</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </div>
                </div>
              </Link>

              {/* Service 2: Data Entry Services */}
              <Link to="/services/data-entry" className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-cyan-100/50 border border-white/50 transition-all duration-500 block hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 hover:bg-white overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-sky-200/50 group-hover:shadow-sky-300/60 transition-all duration-300 group-hover:scale-110">
                    <i className="fas fa-database text-white text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-dark-text mb-3 group-hover:text-sky-600 transition-colors">Data Entry Services</h3>
                  <p className="text-sm text-gray-text leading-relaxed">Efficient and accurate data processing for forms, records, and digital information management.</p>
                  <div className="mt-4 flex items-center gap-2 text-sky-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>Learn More</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </div>
                </div>
              </Link>
            </div>

            {/* Services Grid - Bottom Row (3 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Service 3: EMR Services */}
              <Link to="/services/emr" className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-cyan-100/50 border border-white/50 transition-all duration-500 block hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 hover:bg-white overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-400/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-teal-200/50 group-hover:shadow-teal-300/60 transition-all duration-300 group-hover:scale-110">
                    <i className="fas fa-exchange-alt text-white text-xl"></i>
                  </div>
                  <h3 className="text-base font-bold text-dark-text mb-3 group-hover:text-teal-600 transition-colors">EMR Services</h3>
                  <p className="text-sm text-gray-text leading-relaxed">Supporting electronic records management with data migration and system integration.</p>
                  <div className="mt-4 flex items-center gap-2 text-teal-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>Learn More</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </div>
                </div>
              </Link>

              {/* Service 4: Documentation Services */}
              <Link to="/services/document-conversion" className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-cyan-100/50 border border-white/50 transition-all duration-500 block hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 hover:bg-white overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-sky-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200/50 group-hover:shadow-blue-300/60 transition-all duration-300 group-hover:scale-110">
                    <i className="fas fa-file-alt text-white text-xl"></i>
                  </div>
                  <h3 className="text-base font-bold text-dark-text mb-3 group-hover:text-blue-600 transition-colors">Documentation Services</h3>
                  <p className="text-sm text-gray-text leading-relaxed">Professional document conversion, formatting, and organization for business needs.</p>
                  <div className="mt-4 flex items-center gap-2 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>Learn More</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </div>
                </div>
              </Link>

              {/* Service 5: CAD Services */}
              <Link to="/services/cad" className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-cyan-100/50 border border-white/50 transition-all duration-500 block hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 hover:bg-white overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-200/50 group-hover:shadow-indigo-300/60 transition-all duration-300 group-hover:scale-110">
                    <i className="fas fa-drafting-compass text-white text-xl"></i>
                  </div>
                  <h3 className="text-base font-bold text-dark-text mb-3 group-hover:text-indigo-600 transition-colors">CAD Services</h3>
                  <p className="text-sm text-gray-text leading-relaxed">Technical drawing and design support for architectural and engineering projects.</p>
                  <div className="mt-4 flex items-center gap-2 text-indigo-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>Learn More</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Award Banner Section */}
        <section className="py-16 bg-white relative section-fade-from-blue">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="border-2 border-primary/20 rounded-2xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Certificate Image */}
                <div className="md:w-2/5">
                  <div className="bg-gradient-to-br from-sky-50 to-white rounded-xl p-4 border border-gray-100">
                    <img src="/images/awards.jpg" alt="2023 APAC Insider Business Award" className="w-full rounded-lg shadow-md" />
                  </div>
                </div>

                {/* Content */}
                <div className="md:w-3/5 text-center md:text-left">
                  <p className="text-gray-text text-base md:text-lg mb-6 leading-relaxed">
                    Digiscribe was honored with the <span className="font-semibold">2023 APAC Insider Business Award</span> for outstanding service quality, innovation, and client satisfaction across the region. Our relentless focus on accuracy, secure workflows, and rapid turnaround set a new benchmark for medical transcription. This award recognizes not just our technology but the dedication of every team member who makes Digiscribe a trusted global partner.
                  </p>
                  <Link to="/about" className="inline-flex items-center gap-2 btn-gradient text-white px-6 py-3 rounded-full text-sm font-medium">
                    Learn more about us
                  </Link>
                </div>
              </div>
              {/* South-East Asia BPO Title - Centered at Bottom */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-2xl md:text-3xl">
                  <span className="gradient-text font-semibold">South-East Asia BPO:</span>{' '}
                  <span className="text-dark-text font-medium">Consultancy of the Year</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
