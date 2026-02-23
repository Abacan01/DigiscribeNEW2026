import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      let attempts = 0;
      const maxAttempts = 8;

      const scrollToHash = () => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          window.setTimeout(scrollToHash, 60);
        }
      };

      scrollToHash();
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
