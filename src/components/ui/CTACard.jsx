import { Link } from 'react-router-dom';

export default function CTACard({ icon, title, description }) {
  return (
    <div className="mt-12 bg-gradient-primary rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
        <i className={`${icon} text-white text-2xl`}></i>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">{description}</p>
      <Link
        to="/quote"
        className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Get a Quote
        <i className="fas fa-arrow-right"></i>
      </Link>
    </div>
  );
}
