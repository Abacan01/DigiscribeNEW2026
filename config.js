/**
 * ============================================
 * DIGISCRIBE WEBSITE CONFIGURATION FILE
 * ============================================
 * 
 * This file contains all configurable content for the website.
 * Edit the values below to update content across all pages.
 * 
 * After making changes, save the file and refresh the browser.
 */

const CONFIG = {

    // ============================================
    // COMPANY INFORMATION
    // ============================================
    company: {
        name: "DigiScribe Transcription Corp.",
        shortName: "DigiScribe",
        tagline: "A Philippine-based Medical Transcription Company Serving the Information Technology Enabled Services (ITES) Sector.",
        description: "Professional medical transcription and healthcare documentation services.",
        foundedYear: 2010,
        
        // Logo images
        logo: {
            main: "images/DigiscribeLogoRB.png",
            alt: "DigiScribe Transcription Corp."
        }
    },

    // ============================================
    // CONTACT INFORMATION
    // ============================================
    contact: {
        phone: "(043) 233-2050",
        email: "info@digiscribeasiapacific.com",
        address: {
            line1: "3rd Flr VICMAR Bldg, P Burgos St,",
            line2: "Barangay 10 Batangas City,",
            line3: "Philippines 4200",
            full: "3rd Flr VICMAR Bldg, P Burgos St, Barangay 10 Batangas City, Philippines 4200"
        }
    },

    // ============================================
    // OFFICE HOURS
    // ============================================
    officeHours: {
        weekdays: "Monday - Saturday: 7:00 AM - 6:00 PM",
        weekend: "Sunday: Closed",
        timezone: "Philippine Standard Time (PST)"
    },

    // ============================================
    // SOCIAL MEDIA LINKS
    // ============================================
    socialMedia: {
        linkedin: "#",
        facebook: "#",
        twitter: "#",
        instagram: "#"
    },

    // ============================================
    // IMAGES - Main Website Images
    // ============================================
    images: {
        // Hero section
        hero: {
            doctorImage: "images/doctorhome.png",
            alt: "Healthcare Professional"
        },
        
        // Award banner section
        awardBanner: {
            image: "images/awards.jpg",
            alt: "2023 APAC Insider Business Award"
        },

        // Awards carousel images
        awardsCarousel: [
            {
                src: "images/awards/BESTSTARTUP-NEW.png",
                alt: "Best Award"
            },
            {
                src: "images/awards/PACINSIDER-NEW.png",
                alt: "APAC Insider"
            },
            {
                src: "images/awards/INFOISINFO-NEW.png",
                alt: "Info Award"
            },
            {
                src: "images/awards/PRLOG-NEW.png",
                alt: "PR Log"
            }
        ],

        // Projects page images
        projects: {
            practiceFusion1: "images/practice_fusion_1.png",
            practiceFusion2: "images/practice_fusion_2.png",
            practiceFusion3: "images/practice_fusion_3.png"
        }
    },

    // ============================================
    // SERVICE PAGES - Images & Content
    // ============================================
    services: {
        // Page settings
        pageTitle: "Services We Offer",
        pageDescription: "Founded in 2005, Digiscribe Transcription Corp. has grown from a small transcription service into a leading provider of medical documentation and back-office solutions in the Philippines and beyond.",
        
        // ============================================
        // SERVICE 1: Transcription Support
        // ============================================
        transcription: {
            title: "Transcription Support",
            shortTitle: "Transcription",
            icon: "fas fa-headset",
            // Background image for service card
            cardImage: "images/services/Tanscription%20Services/Medical%20Trans.jpg",
            // Accent color for the gradient overlay (Tailwind color)
            accentColor: "primary",
            // Link to detailed service page
            link: "service-transcription.html",
            shortDescription: "Professional transcription services designed to support healthcare providers with accurate documentation of medical records and reports.",
            fullDescription: "Our transcription support services convert audio recordings from healthcare providers into accurate, written documentation. Our team of certified transcriptionists ensures every report meets the highest standards of accuracy and compliance.",
            features: [
                "HIPAA-compliant dictation processing",
                "24-48 hour turnaround time",
                "99.5% accuracy rate guaranteed",
                "Multi-specialty support",
                "Direct EHR integration available",
                "Quality assurance review on all documents"
            ],
            benefits: [
                { icon: "fas fa-clock", title: "24-48 Hour Turnaround" },
                { icon: "fas fa-check-double", title: "99.5% Accuracy Rate" },
                { icon: "fas fa-shield-alt", title: "HIPAA Compliant" }
            ]
        },

        // ============================================
        // SERVICE 2: Data Entry
        // ============================================
        dataEntry: {
            title: "Data Entry",
            shortTitle: "Data Entry",
            icon: "fas fa-keyboard",
            cardImage: "images/services/Data%20entry/Batch%20Proof%20Report.jpg",
            accentColor: "sky-600",
            link: "service-data-entry.html",
            shortDescription: "Accurate and efficient data entry services for medical records, billing information, and patient data management.",
            fullDescription: "Our data entry specialists handle the accurate input of patient information, medical records, and billing data into your systems. We ensure data integrity while maintaining strict confidentiality.",
            features: [
                "Patient demographic entry",
                "Insurance verification and data input",
                "Charge entry and coding support",
                "Document scanning and indexing",
                "Quality control and data validation",
                "Multi-platform EMR support"
            ],
            benefits: [
                { icon: "fas fa-bullseye", title: "99% Data Accuracy" },
                { icon: "fas fa-clock", title: "Same-Day Processing" },
                { icon: "fas fa-shield-alt", title: "HIPAA Compliant" }
            ]
        },

        // ============================================
        // SERVICE 3: EMR (Electronic Medical Records)
        // ============================================
        emr: {
            title: "EMR",
            shortTitle: "EMR",
            icon: "fas fa-laptop-medical",
            cardImage: "images/services/EMR%20Services/Appointment%20Scheduling.png",
            accentColor: "emerald-600",
            link: "service-emr.html",
            shortDescription: "Electronic Medical Records management, data migration, and chart building services for seamless healthcare operations.",
            fullDescription: "We specialize in seamless EMR data migration, ensuring your patient records are accurately transferred between systems. Our chart building services create complete, organized patient charts from legacy records.",
            features: [
                "Legacy system data extraction",
                "Data mapping and transformation",
                "Quality assurance validation",
                "Chart building from paper records",
                "Document indexing and organization",
                "Post-migration support"
            ],
            benefits: [
                { icon: "fas fa-check-circle", title: "100% Data Integrity" },
                { icon: "fas fa-headset", title: "24/7 Support" },
                { icon: "fas fa-shield-alt", title: "Secure Transfer" }
            ]
        },

        // ============================================
        // SERVICE 4: Document Conversion
        // ============================================
        documentConversion: {
            title: "Document Conversion",
            shortTitle: "Doc Conversion",
            icon: "fas fa-file-export",
            cardImage: "images/services/Documnt%20Conversion.png",
            accentColor: "violet-600",
            link: "service-document-conversion.html",
            shortDescription: "Converting documents between formats while maintaining accuracy, formatting, and data integrity.",
            fullDescription: "Our document conversion services transform your files into the formats you need. Whether converting paper documents to digital, or transforming between file formats, we ensure accuracy and maintain data integrity throughout the process.",
            features: [
                "Paper to digital conversion",
                "PDF to editable formats",
                "Image to text (OCR)",
                "Format standardization",
                "Batch processing capabilities",
                "Quality verification"
            ],
            benefits: [
                { icon: "fas fa-sync-alt", title: "Multiple Format Support" },
                { icon: "fas fa-check-double", title: "High Accuracy OCR" },
                { icon: "fas fa-tachometer-alt", title: "Fast Turnaround" }
            ]
        },

        // ============================================
        // SERVICE 5: CAD (Computer-Aided Design)
        // ============================================
        cad: {
            title: "CAD",
            shortTitle: "CAD",
            icon: "fas fa-drafting-compass",
            cardImage: "images/services/CAD%20Service/2D%20Drafting.jpg",
            accentColor: "amber-600",
            link: "service-cad.html",
            shortDescription: "Computer-Aided Design services for technical drawings, blueprints, and design documentation.",
            fullDescription: "Our CAD services provide professional technical drawing and design support. From 2D drafting to 3D modeling, we deliver precise and detailed design documentation for various industries.",
            features: [
                "2D drafting and detailing",
                "3D modeling and rendering",
                "Technical drawing conversion",
                "Blueprint digitization",
                "Design modifications",
                "Format conversion (DWG, DXF, PDF)"
            ],
            benefits: [
                { icon: "fas fa-ruler-combined", title: "Precision Drafting" },
                { icon: "fas fa-cubes", title: "2D & 3D Support" },
                { icon: "fas fa-clock", title: "Quick Turnaround" }
            ]
        },

        // ============================================
        // SERVICE 6: Product Listing
        // ============================================
        productListing: {
            title: "Product Listing",
            shortTitle: "Product Listing",
            icon: "fas fa-shopping-cart",
            cardImage: "images/services/Data%20entry/Product%20Listing.jpg",
            accentColor: "rose-600",
            link: "service-product-listing.html",
            shortDescription: "E-commerce product listing services including data entry, image optimization, and catalog management.",
            fullDescription: "Our product listing services help e-commerce businesses manage their online catalogs efficiently. We handle product data entry, image optimization, description writing, and catalog organization across multiple platforms.",
            features: [
                "Product data entry",
                "Image editing and optimization",
                "SEO-friendly descriptions",
                "Multi-platform listing",
                "Inventory management support",
                "Bulk upload processing"
            ],
            benefits: [
                { icon: "fas fa-store", title: "Multi-Platform Support" },
                { icon: "fas fa-search", title: "SEO Optimized" },
                { icon: "fas fa-images", title: "Image Enhancement" }
            ]
        }
    },

    // ============================================
    // HOMEPAGE HERO SECTION
    // ============================================
    hero: {
        title: "Medical Transcription and Healthcare Solutions Provider",
        subtitle: "Transforming healthcare documentation with accuracy, security, and efficiency.",
        primaryButton: {
            text: "Learn more about us",
            link: "about.html"
        },
        secondaryButton: {
            text: "Get free quote",
            link: "quote.html"
        }
    },

    // ============================================
    // STATISTICS / METRICS
    // ============================================
    stats: {
        yearsExperience: "15+",
        clientsServed: "500+",
        documentsProcessed: "1M+",
        accuracy: "99.5%"
    },

    // ============================================
    // AWARDS SECTION
    // ============================================
    awards: {
        title: "2023 APAC Insider Business Award",
        description: "Digiscribe was honored with the 2023 APAC Insider Business Award for outstanding service quality, innovation, and client satisfaction across the region. Our relentless focus on accuracy, secure workflows, and rapid turnaround set a new benchmark for medical transcription.",
        subtitle: "South-East Asia BPO:",
        awardName: "Consultancy of the Year"
    },

    // ============================================
    // ABOUT PAGE
    // ============================================
    about: {
        mission: "To provide accurate, secure, and timely medical transcription services that empower healthcare providers to focus on patient care.",
        vision: "To be the leading medical transcription partner in the Asia-Pacific region, known for excellence and innovation.",
        values: [
            {
                icon: "fas fa-shield-alt",
                title: "Security",
                description: "HIPAA-compliant processes protecting patient data"
            },
            {
                icon: "fas fa-check-circle",
                title: "Accuracy",
                description: "99.5% accuracy rate on all documentation"
            },
            {
                icon: "fas fa-clock",
                title: "Timeliness",
                description: "Fast turnaround without compromising quality"
            },
            {
                icon: "fas fa-users",
                title: "Partnership",
                description: "Dedicated support for every client"
            }
        ]
    },

    // ============================================
    // SEO & META INFORMATION
    // ============================================
    meta: {
        defaultTitle: "DigiScribe Transcription Corp. - Medical Transcription Services",
        titleSuffix: " - DigiScribe Transcription Corp.",
        description: "Professional medical transcription and healthcare documentation services. HIPAA compliant, 99.5% accuracy, fast turnaround.",
        keywords: "medical transcription, healthcare documentation, EMR management, claims processing, data entry, Philippines BPO"
    }
};

// ============================================
// DO NOT EDIT BELOW THIS LINE
// Helper functions to apply config to the page
// ============================================

/**
 * Apply configuration to the current page
 * Call this function after DOM is loaded
 */
function applyConfig() {
    // Apply logo
    document.querySelectorAll('[data-config="logo"]').forEach(el => {
        el.src = CONFIG.company.logo.main;
        el.alt = CONFIG.company.logo.alt;
    });

    // Apply company name
    document.querySelectorAll('[data-config="company-name"]').forEach(el => {
        el.textContent = CONFIG.company.name;
    });

    // Apply tagline
    document.querySelectorAll('[data-config="tagline"]').forEach(el => {
        el.textContent = CONFIG.company.tagline;
    });

    // Apply contact info
    document.querySelectorAll('[data-config="phone"]').forEach(el => {
        el.textContent = CONFIG.contact.phone;
    });

    document.querySelectorAll('[data-config="email"]').forEach(el => {
        el.textContent = CONFIG.contact.email;
    });

    document.querySelectorAll('[data-config="address"]').forEach(el => {
        el.innerHTML = `${CONFIG.contact.address.line1}<br>${CONFIG.contact.address.line2}<br>${CONFIG.contact.address.line3}`;
    });

    // Apply office hours
    document.querySelectorAll('[data-config="office-hours-weekdays"]').forEach(el => {
        el.textContent = CONFIG.officeHours.weekdays;
    });

    document.querySelectorAll('[data-config="office-hours-weekend"]').forEach(el => {
        el.textContent = CONFIG.officeHours.weekend;
    });

    document.querySelectorAll('[data-config="timezone"]').forEach(el => {
        el.textContent = CONFIG.officeHours.timezone;
    });

    // Apply social media links
    document.querySelectorAll('[data-config="social-linkedin"]').forEach(el => {
        el.href = CONFIG.socialMedia.linkedin;
    });

    document.querySelectorAll('[data-config="social-facebook"]').forEach(el => {
        el.href = CONFIG.socialMedia.facebook;
    });

    // Apply hero content
    document.querySelectorAll('[data-config="hero-title"]').forEach(el => {
        el.textContent = CONFIG.hero.title;
    });

    document.querySelectorAll('[data-config="hero-subtitle"]').forEach(el => {
        el.textContent = CONFIG.hero.subtitle;
    });

    document.querySelectorAll('[data-config="hero-image"]').forEach(el => {
        el.src = CONFIG.images.hero.doctorImage;
        el.alt = CONFIG.images.hero.alt;
    });

    // Apply award banner
    document.querySelectorAll('[data-config="award-image"]').forEach(el => {
        el.src = CONFIG.images.awardBanner.image;
        el.alt = CONFIG.images.awardBanner.alt;
    });

    document.querySelectorAll('[data-config="award-description"]').forEach(el => {
        el.innerHTML = CONFIG.awards.description.replace(
            CONFIG.awards.title,
            `<span class="font-semibold">${CONFIG.awards.title}</span>`
        );
    });

    // Apply services page title and description
    document.querySelectorAll('[data-config="services-title"]').forEach(el => {
        el.textContent = CONFIG.services.pageTitle;
    });

    document.querySelectorAll('[data-config="services-description"]').forEach(el => {
        el.textContent = CONFIG.services.pageDescription;
    });

    // Render services grid if container exists
    renderServicesGrid();
}

/**
 * Render the services grid from config
 * This populates the services page cards dynamically
 */
function renderServicesGrid() {
    const topRowContainer = document.getElementById('services-top-row');
    const bottomRowContainer = document.getElementById('services-bottom-row');
    
    if (!topRowContainer && !bottomRowContainer) return;

    // Define which services go in which row (3 top, 3 bottom)
    const topRowServices = ['transcription', 'dataEntry', 'emr'];
    const bottomRowServices = ['documentConversion', 'cad', 'productListing'];

    // Render top row (all same size now - 3 columns)
    if (topRowContainer) {
        topRowContainer.innerHTML = topRowServices.map(key => {
            const service = CONFIG.services[key];
            if (!service) return '';
            return createServiceCard(key, service, 'medium');
        }).join('');
    }

    // Render bottom row (3 columns)
    if (bottomRowContainer) {
        bottomRowContainer.innerHTML = bottomRowServices.map(key => {
            const service = CONFIG.services[key];
            if (!service) return '';
            return createServiceCard(key, service, 'medium');
        }).join('');
    }
}

/**
 * Create a service card HTML
 * @param {string} key - Service key
 * @param {object} service - Service configuration
 * @param {string} size - 'large', 'medium', or 'small'
 * @returns {string} HTML string
 */
function createServiceCard(key, service, size) {
    // All cards now use consistent medium sizing for 3-column grid
    const minHeight = 'min-h-[280px]';
    const padding = 'p-6';
    const iconSize = 'w-12 h-12';
    const iconTextSize = 'text-xl';
    const titleSize = 'text-base';
    const titleMargin = 'mb-2';
    const descMargin = 'mb-4';
    const btnPadding = 'px-4 py-2';

    return `
        <div id="${key}" class="service-card relative rounded-2xl ${padding} shadow-lg overflow-hidden ${minHeight} group" 
             style="background: url('${service.cardImage}') center/cover no-repeat;">
            <!-- Dark overlay for text readability -->
            <div class="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-sky-600/60 group-hover:from-slate-900/80 group-hover:to-cyan-500/70 transition-all duration-300"></div>
            <div class="relative z-10">
                <div class="${iconSize} bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                    <i class="${service.icon} text-white ${iconTextSize}"></i>
                </div>
                <h3 class="${titleSize} font-semibold text-white ${titleMargin}">${service.title}</h3>
                <p class="text-xs text-white/80 leading-relaxed ${descMargin}">
                    ${service.shortDescription}
                </p>
                <a href="${service.link}" class="learn-more-btn inline-flex items-center gap-2 ${btnPadding} rounded-full text-xs font-medium transition-colors">
                    Learn More
                </a>
            </div>
        </div>
    `;
}

/**
 * Get service config by key
 * @param {string} key - Service key (transcription, dataEntry, claims, emr, rcm)
 * @returns {object} Service configuration
 */
function getServiceConfig(key) {
    return CONFIG.services[key] || null;
}

/**
 * Get image URL from config
 * @param {string} path - Dot notation path (e.g., "images.hero.doctorImage")
 * @returns {string} Image URL
 */
function getImage(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], CONFIG) || '';
}

// Auto-apply config when DOM is ready
document.addEventListener('DOMContentLoaded', applyConfig);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
