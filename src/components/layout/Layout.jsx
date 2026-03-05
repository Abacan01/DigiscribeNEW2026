import BackgroundBlobs from './BackgroundBlobs';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children, heroContent, hideFooter = false }) {
  return (
    <div className="font-poppins">
      <BackgroundBlobs />
      <div className="hero-gradient">
        <Navbar />
        {heroContent}
      </div>
      {children}
      {!hideFooter && <Footer />}
    </div>
  );
}
