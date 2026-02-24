import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { config } from '../data/config';

export default function ServicesPage() {
  const animationRef = useScrollAnimation();

  useEffect(() => {
    document.title = 'Services - DigiScribe Transcription Corp.';
  }, []);

  // Define service card order: top row and bottom row
  const topRowKeys = ['transcription', 'dataEntry', 'emr'];
  const bottomRowKeys = ['documentConversion', 'cad', 'productListing'];

  const renderServiceCard = (serviceKey) => {
    const service = config.services[serviceKey];
    if (!service) return null;

    return (
      <Link
        key={serviceKey}
        to={service.link}
        className="service-card group relative rounded-2xl overflow-hidden shadow-lg block h-64 transition-[transform,box-shadow] duration-700 ease-out hover:shadow-xl hover:-translate-y-1"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={service.cardImage}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 group-hover:via-black/50 transition-all duration-700 ease-out"></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <div className="mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all duration-500 ease-out">
              <i className={`${service.icon} text-white text-xl`}></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
            <p className="text-sm text-gray-200 leading-relaxed line-clamp-2">{service.shortDescription}</p>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out transform translate-y-1 group-hover:translate-y-0">
            <span>Learn More</span>
            <i className="fas fa-arrow-right text-xs"></i>
          </div>
        </div>
      </Link>
    );
  };

  const heroContent = (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-dark-text mb-4">
            <span className="gradient-text">{config.services.pageTitle}</span>
          </h1>
          <p className="text-gray-text text-sm max-w-2xl mx-auto leading-relaxed">
            {config.services.pageDescription}
          </p>
        </div>

        {/* Services Grid - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {topRowKeys.map((key) => renderServiceCard(key))}
        </div>

        {/* Services Grid - Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bottomRowKeys.map((key) => renderServiceCard(key))}
        </div>
      </div>
    </section>
  );

  return (
    <Layout heroContent={heroContent}>
      <div ref={animationRef}>
        {/* No content below the hero for this page */}
      </div>
    </Layout>
  );
}
