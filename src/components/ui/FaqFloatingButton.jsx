import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

const faqSections = [
  {
    title: 'General Questions',
    items: [
      {
        q: 'What is medical transcription?',
        a: 'Medical transcription involves converting audio recordings of medical reports, patient notes, and consultations into accurate written documents for healthcare providers.',
      },
      {
        q: 'Who can benefit from your transcription services?',
        a: 'Our transcription services are designed for doctors, clinics, hospitals, and healthcare organizations of all sizes, both locally and internationally.',
      },
      {
        q: 'What medical specialties do you cover?',
        a: 'We provide transcription services for a wide range of medical specialties for ESL, including but not limited to: Cardiology, Orthopedics, Psychiatry, Physical Therapy, Neurology, and Pediatric Endocrinology.',
      },
    ],
  },
  {
    title: 'How Our Service Works',
    items: [
      {
        q: 'How do I send my audio recordings to you?',
        a: 'You can easily upload your audio files through our secure online portal, via file transfer protocol (FTP), or by integrating with your existing EHR/EMR system.',
      },
      {
        q: 'What is your usual turnaround time?',
        a: 'Our standard turnaround time is between 24 to 48 hours. We also offer expedited services if you need your transcripts sooner.',
      },
      {
        q: 'Can you integrate with my current EMR/EHR system?',
        a: 'Yes, we support integration with most EMR and EHR platforms to ensure a smooth and hassle-free transcription process.',
      },
    ],
  },
  {
    title: 'Privacy & Data Security',
    items: [
      {
        q: 'How do you protect the confidentiality of patient data?',
        a: "We strictly follow HIPAA guidelines (or your country's privacy regulations) and use advanced encryption methods to safeguard all patient information.",
      },
      {
        q: 'Are your transcriptionists trained in confidentiality?',
        a: 'Yes, every transcriptionist undergoes confidentiality training and is bound by strict non-disclosure agreements to ensure complete privacy.',
      },
    ],
  },
  {
    title: 'Pricing & Payment',
    items: [
      {
        q: 'How much do your services cost?',
        a: 'Pricing depends on turnaround time, audio quality, and volume. Contact us for a customized quote.',
      },
      {
        q: 'Do you offer discounts for bulk transcription?',
        a: 'Yes, we offer competitive rates and discounts for bulk or long-term contracts.',
      },
    ],
  },
  {
    title: 'Quality Assurance',
    items: [
      {
        q: 'How accurate are your transcripts?',
        a: 'Our transcription process includes multiple levels of quality control, ensuring 98-99% accuracy on all delivered documents.',
      },
      {
        q: 'Do you provide editing or proofreading services?',
        a: 'Absolutely. All transcripts are reviewed and proofread to maintain the highest level of accuracy and clarity.',
      },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I start using your services?',
        a: "Simply contact us via our website, phone, or email. We'll guide you through a quick onboarding process.",
      },
    ],
  },
];

const HIDDEN_PATHS = new Set(['/login', '/dashboard', '/admin/dashboard', '/upload']);

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  return (
    <div
      style={{
        borderRadius: '12px',
        border: open ? '1px solid rgba(14,165,233,0.25)' : '1px solid rgba(226,232,240,0.8)',
        background: open ? 'rgba(240,249,255,0.6)' : 'rgba(255,255,255,0.7)',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155', lineHeight: 1.45, flex: 1 }}>{q}</span>
        <span
          style={{
            flexShrink: 0,
            marginTop: '1px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: open ? 'rgba(14,165,233,0.12)' : 'rgba(226,232,240,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 250ms cubic-bezier(0.22,1,0.36,1), background 200ms ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: open ? '#0ea5e9' : '#94a3b8',
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" width="9" height="9">
            <line x1="6" y1="1.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        ref={bodyRef}
        style={{
          overflow: 'hidden',
          maxHeight: open ? `${bodyRef.current?.scrollHeight ?? 400}px` : '0px',
          opacity: open ? 1 : 0,
          transition: 'max-height 280ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease',
        }}
      >
        <p style={{ padding: '0 12px 11px', fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

export default function FaqFloatingButton() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHidden = HIDDEN_PATHS.has(location.pathname);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 280);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (isHidden) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: "'Poppins', sans-serif",
        pointerEvents: 'none',
      }}
    >

      {/* ── Panel ── */}
      <div
        style={{
          marginBottom: '14px',
          width: 'min(88vw, 370px)',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(2,132,199,0.15), 0 6px 20px rgba(15,23,42,0.1)',
          border: '1px solid rgba(186,230,253,0.55)',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transition: 'opacity 240ms cubic-bezier(0.22,1,0.36,1), transform 240ms cubic-bezier(0.22,1,0.36,1)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.9) translateY(14px)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >

        {/* Header */}
        <div
          style={{
            padding: '15px 16px 13px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-circle-question" style={{ fontSize: '17px', color: '#fff' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>Frequently Asked Questions</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.4 }}>Quick answers — medical transcription</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close FAQ"
            style={{
              background: 'rgba(255,255,255,0.16)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '14px',
              flexShrink: 0,
              transition: 'background 140ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            maxHeight: '56vh',
            overflowY: 'auto',
            padding: '14px 12px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#bae6fd transparent',
          }}
        >
          {faqSections.map((section, si) => (
            <div key={section.title} style={{ marginBottom: si < faqSections.length - 1 ? '16px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
                <div
                  style={{
                    height: '2px',
                    width: '14px',
                    borderRadius: '99px',
                    background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#0284c7',
                  }}
                >
                  {section.title}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '11px 14px',
            borderTop: '1px solid rgba(186,230,253,0.5)',
            background: 'rgba(240,249,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>Still have questions?</span>
          <a
            href="/quote"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#0284c7',
              background: 'rgba(14,165,233,0.1)',
              padding: '5px 14px',
              borderRadius: '99px',
              textDecoration: 'none',
              border: '1px solid rgba(14,165,233,0.18)',
              transition: 'background 140ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14,165,233,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(14,165,233,0.1)')}
          >
            Contact Us →
          </a>
        </div>
      </div>

      {/* ── Scroll-to-top button ── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        style={{
          marginBottom: '10px',
          position: 'relative',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '1.5px solid rgba(186,230,253,0.7)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(2,132,199,0.18), 0 1px 6px rgba(15,23,42,0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0ea5e9',
          outline: 'none',
          transition:
            'opacity 240ms cubic-bezier(0.22,1,0.36,1), transform 240ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease, background 150ms ease',
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? 'scale(1) translateY(0px)' : 'scale(0.8) translateY(8px)',
          pointerEvents: scrolled ? 'auto' : 'none',
          alignSelf: 'flex-end',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(240,249,255,0.98)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(2,132,199,0.28), 0 2px 8px rgba(15,23,42,0.1)';
          e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(2,132,199,0.18), 0 1px 6px rgba(15,23,42,0.08)';
          e.currentTarget.style.transform = 'scale(1) translateY(0px)';
        }}
      >
        <i className="fa-solid fa-chevron-up" style={{ fontSize: '14px' }} />
      </button>

      {/* ── FAQ FAB button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close FAQ' : 'Open FAQ'}
        aria-expanded={isOpen}
        style={{
          position: 'relative',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)',
          boxShadow: isOpen
            ? '0 8px 28px rgba(2,132,199,0.5), 0 3px 10px rgba(15,23,42,0.14)'
            : '0 6px 22px rgba(2,132,199,0.42), 0 2px 8px rgba(15,23,42,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          outline: 'none',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
          transform: isOpen ? 'scale(1.08)' : 'scale(1)',
          flexShrink: 0,
          pointerEvents: 'auto',
          alignSelf: 'flex-end',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.12)';
          e.currentTarget.style.boxShadow = '0 10px 32px rgba(2,132,199,0.55), 0 4px 14px rgba(15,23,42,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'scale(1.08)' : 'scale(1)';
          e.currentTarget.style.boxShadow = isOpen
            ? '0 8px 28px rgba(2,132,199,0.5), 0 3px 10px rgba(15,23,42,0.14)'
            : '0 6px 22px rgba(2,132,199,0.42), 0 2px 8px rgba(15,23,42,0.1)';
        }}
      >
        {/* Pulse ring — only when closed */}
        {!isOpen && (
          <span
            className="faq-fab-ring"
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              border: '2px solid rgba(14,165,233,0.38)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Question icon */}
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 160ms ease, transform 200ms cubic-bezier(0.22,1,0.36,1)',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'scale(0.55) rotate(-25deg)' : 'scale(1) rotate(0deg)',
          }}
        >
          <i className="fa-solid fa-circle-question" style={{ fontSize: '23px' }} />
        </span>

        {/* X icon */}
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 160ms ease, transform 200ms cubic-bezier(0.22,1,0.36,1)',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scale(1) rotate(0deg)' : 'scale(0.55) rotate(25deg)',
          }}
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: '22px' }} />
        </span>
      </button>
    </div>,
    document.body,
  );
}
