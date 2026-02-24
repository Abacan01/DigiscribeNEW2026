import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { config } from '../../data/config';

export default function Footer() {
  const location = useLocation();
  const hideQuickLinks = ['/dashboard', '/admin/dashboard', '/upload'].includes(location.pathname);

  return (
    <footer className="bg-gray-50 border-t border-gray-100 relative mt-6 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid grid-cols-1 gap-4 ${hideQuickLinks ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Company Info */}
          <div>
            <Link to="/" className="inline-block mb-3">
              <img src={config.company.logo.main} alt={config.company.logo.alt} className="h-16 w-auto" />
            </Link>
            <p className="text-xs text-gray-text leading-relaxed mb-3">
              {config.company.tagline}
            </p>
            <div className="flex gap-2">
              <a href={config.socialMedia.linkedin} className="w-7 h-7 social-gradient rounded flex items-center justify-center">
                <i className="fab fa-linkedin-in text-white text-sm"></i>
              </a>
              <a href={config.socialMedia.facebook} className="w-7 h-7 social-gradient rounded flex items-center justify-center">
                <i className="fab fa-facebook-f text-white text-sm"></i>
              </a>
            </div>
          </div>

          {/* Office Hours */}
          <div>
            <h3 className="text-sm font-semibold text-dark-text mb-3">Office Hours</h3>
            <div className="space-y-1.5 text-xs text-gray-text">
              <p>{config.officeHours.weekdays}</p>
              <p>{config.officeHours.weekend}</p>
              <span className="text-primary block mt-2">{config.officeHours.timezone}</span>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-sm font-semibold text-dark-text mb-3">Contact Us</h3>
            <div className="space-y-1.5 text-xs text-gray-text">
              <p>
                {config.contact.address.line1}<br />
                {config.contact.address.line2}<br />
                {config.contact.address.line3}
              </p>
              <p className="pt-1.5">{config.contact.phone}</p>
              <p>{config.contact.email}</p>
            </div>
          </div>

          {/* Quick Links */}
          {!hideQuickLinks && (
            <div>
              <h3 className="text-sm font-semibold text-dark-text mb-3">Quick Links</h3>
              <ul className="space-y-1.5 text-xs text-gray-text">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/projects" className="hover:text-primary transition-colors">Projects</Link></li>
                <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <p className="text-center text-xs text-gray-400">
            Digiscribe Transcription Corp 2026 &copy; All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
