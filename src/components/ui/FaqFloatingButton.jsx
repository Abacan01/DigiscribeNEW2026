import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const faqSections = [
  {
    title: 'General Questions',
    items: [
      {
        question: 'What is medical transcription?',
        answer:
          'Medical transcription involves converting audio recordings of medical reports, patient notes, and consultations into accurate written documents for healthcare providers.',
      },
      {
        question: 'Who can benefit from your transcription services?',
        answer:
          'Our transcription services are designed for doctors, clinics, hospitals, and healthcare organizations of all sizes, both locally and internationally.',
      },
      {
        question: 'What medical specialties do you cover?',
        answer:
          'We provide transcription services for a wide range of medical specialties for ESL, including but not limited to: Cardiology, Orthopedics, Psychiatry, Physical Therapy, Neurology, and Pediatric Endocrinology.',
      },
    ],
  },
  {
    title: 'How Our Service Works',
    items: [
      {
        question: 'How do I send my audio recordings to you?',
        answer:
          'You can easily upload your audio files through our secure online portal, via file transfer protocol (FTP), or by integrating with your existing EHR/EMR system.',
      },
      {
        question: 'What is your usual turnaround time?',
        answer:
          'Our standard turnaround time is between 24 to 48 hours. We also offer expedited services if you need your transcripts sooner.',
      },
      {
        question: 'Can you integrate with my current EMR/EHR system?',
        answer:
          'Yes, we support integration with most EMR and EHR platforms to ensure a smooth and hassle-free transcription process.',
      },
    ],
  },
  {
    title: 'Privacy and Data Security',
    items: [
      {
        question: 'How do you protect the confidentiality of patient data?',
        answer:
          'We strictly follow HIPAA guidelines (or your country’s privacy regulations) and use advanced encryption methods to safeguard all patient information.',
      },
      {
        question: 'Are your transcriptionists trained in confidentiality?',
        answer:
          'Yes, every transcriptionist on our team undergoes confidentiality training and is bound by strict non-disclosure agreements to ensure complete privacy.',
      },
    ],
  },
  {
    title: 'Pricing Payment Information',
    items: [
      {
        question: 'How much do your services cost?',
        answer:
          'Pricing depends on factors like turnaround time, audio quality, and volume. Contact us for a customized quote.',
      },
      {
        question: 'Do you offer discounts for bulk transcription?',
        answer:
          'Yes, we offer competitive rates and discounts for bulk or long-term contracts.',
      },
    ],
  },
  {
    title: 'Quality Assurance',
    items: [
      {
        question: 'How accurate are your transcripts?',
        answer:
          'Our transcription process includes multiple levels of quality control, ensuring 98-99% accuracy on all delivered documents.',
      },
      {
        question: 'Do you provide editing or proofreading services?',
        answer:
          'Absolutely. All transcripts are reviewed and proofread to maintain the highest level of accuracy and clarity.',
      },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I start using your services?',
        answer:
          'Simply contact us via our website, phone, or email. We’ll guide you through a quick onboarding process.',
      },
    ],
  },
];

const hiddenPaths = new Set(['/login', '/dashboard', '/admin/dashboard']);

export default function FaqFloatingButton() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isHidden = useMemo(() => hiddenPaths.has(location.pathname), [location.pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen]);

  if (isHidden) return null;

  return (
    <div className="fixed right-5 bottom-5 z-[120] sm:right-7 sm:bottom-7">
      <div
        className={`faq-panel mb-3 w-[min(90vw,28rem)] origin-bottom-right rounded-2xl border border-sky-100/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-95 opacity-0'
        }`}
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <h3 className="text-base font-semibold text-slate-900">Frequently Asked Questions</h3>
          <p className="mt-1 text-xs text-slate-500">Quick answers about our medical transcription services.</p>

          <div className="mt-3 space-y-3">
            {faqSections.map((section) => (
              <section key={section.title}>
                <h4 className="text-sm font-semibold text-sky-700">{section.title}</h4>
                <div className="mt-2 space-y-2">
                  {section.items.map((item) => (
                    <details key={item.question} className="group rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2">
                      <summary className="relative cursor-pointer list-none pr-5 text-sm font-medium text-slate-700">
                        {item.question}
                        <span className="pointer-events-none absolute right-5 text-sky-500 transition-transform duration-200 group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle FAQ"
        aria-expanded={isOpen}
        className="faq-fab group relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-sky-100 bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-500 text-white shadow-xl outline-none transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <span className="faq-fab-ring" aria-hidden="true" />
        <i className="fa-solid fa-circle-question text-2xl" aria-hidden="true" />
      </button>
    </div>
  );
}
