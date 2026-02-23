import { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function AboutPage() {
  const animationRef = useScrollAnimation();

  useEffect(() => {
    document.title = 'About Us - DigiScribe Transcription Corp.';
  }, []);

  const heroContent = (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-text mb-4">
            <span className="gradient-text">About Us</span>
          </h1>
          <p className="text-gray-text text-sm max-w-xl mx-auto leading-relaxed">
            Founded in 2005, Digiscribe Transcription Corp. has grown from a small transcription service into a leading provider of medical documentation and back-office solutions in the Philippines and beyond.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Left Content - Timeline */}
          <div className="lg:w-1/2">
            <div className="space-y-8">
              {/* Journey */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="number-circle">1</div>
                  <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-semibold text-dark-text mb-2">Journey</h3>
                  <p className="text-sm text-gray-text leading-relaxed">
                    Our journey began with a simple vision: To provide accurate, reliable, and secure medical transcription services at cost-effective pricing.
                  </p>
                </div>
              </div>

              {/* Services */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="number-circle">2</div>
                  <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-semibold text-dark-text mb-2">Services</h3>
                  <p className="text-sm text-gray-text leading-relaxed">
                    Over the years, we've expanded our services portfolio to include billing and coding services, with a team of highly skilled professionals who use our experience to serve our clients better.
                  </p>
                </div>
              </div>

              {/* Organizations */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="number-circle">3</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-dark-text mb-2">Organizations</h3>
                  <p className="text-sm text-gray-text leading-relaxed">
                    Today, we work with healthcare organizations around the globe, from small clinics to large hospital networks, delivering transcription services that meet the highest standards of quality and compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-1/2">
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=450&fit=crop" alt="Professional at work" className="w-full rounded-2xl shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <Layout heroContent={heroContent}>
      <div ref={animationRef}>
        {/* Why Choose Digiscribe Section */}
        <section className="py-12 lg:py-16 bg-gray-50 relative section-fade-to-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-5xl font-semibold text-dark-text mb-3">
                <span className="gradient-text">Why</span> choose <span className="gradient-text">Digiscribe</span>?
              </h2>
              <p className="text-gray-text text-sm max-w-xl mx-auto">
                We combine expertise, technology, and dedication to deliver exceptional results
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-10 max-w-4xl mx-auto">
              {/* Secured */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Secured</h3>
                <p className="text-sm text-gray-text leading-relaxed">We safeguard your medical data with strict HIPAA compliance and confidentiality standards.</p>
              </div>

              {/* Expert */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Expert</h3>
                <p className="text-sm text-gray-text leading-relaxed">Our trained transcriptionists and coders understand healthcare requirements inside and out.</p>
              </div>

              {/* Affordable */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Affordable</h3>
                <p className="text-sm text-gray-text leading-relaxed">Lower your operational costs while maintaining high-quality back-office support.</p>
              </div>

              {/* Fast */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Fast</h3>
                <p className="text-sm text-gray-text leading-relaxed">Our 24-hour turnaround time keeps your practice running without delays.</p>
              </div>

              {/* Tailored */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Tailored</h3>
                <p className="text-sm text-gray-text leading-relaxed">We create solutions that match your organization's specific workflow and size.</p>
              </div>

              {/* Reliable */}
              <div className="text-center">
                <h3 className="gradient-text font-semibold text-3xl mb-3">Reliable</h3>
                <p className="text-sm text-gray-text leading-relaxed">Count on consistent accuracy and timely delivery you can depend on.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
