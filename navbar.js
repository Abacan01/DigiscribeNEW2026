// Navbar visibility on scroll
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    let scrollTimeout;
    let isScrolling = false;

    // Show navbar on page load (always visible at top)
    header.classList.add('nav-visible');
    
    // Check scroll position on load
    if (window.scrollY > 10) {
        header.classList.add('nav-scrolled');
    }

    // Handle scroll for background visibility
    window.addEventListener('scroll', function() {
        isScrolling = true;
        header.classList.add('nav-visible');

        // Add/remove scrolled class based on scroll position
        if (window.scrollY > 10) {
            header.classList.add('nav-scrolled');
        } else {
            header.classList.remove('nav-scrolled');
        }

        // Clear existing timeout
        clearTimeout(scrollTimeout);

        // Hide navbar 1.5 seconds after scrolling stops, but only if not at top
        scrollTimeout = setTimeout(function() {
            // Keep navbar visible if at the top of the page
            if (window.scrollY > 50) {
                header.classList.remove('nav-visible');
            }
            isScrolling = false;
        }, 1500);
    });

    // Show navbar when mouse is near the top of the page
    document.addEventListener('mousemove', function(e) {
        if (e.clientY < 100) {
            header.classList.add('nav-visible');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                // Keep navbar visible if at the top of the page
                if (!isScrolling && e.clientY >= 100 && window.scrollY > 50) {
                    header.classList.remove('nav-visible');
                }
            }, 1500);
        }
    });
});
