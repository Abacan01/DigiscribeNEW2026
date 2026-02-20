export const config = {
  company: {
    name: "DigiScribe Transcription Corp.",
    shortName: "DigiScribe",
    tagline: "A Philippine-based Medical Transcription Company Serving the Information Technology Enabled Services (ITES) Sector.",
    description: "Professional medical transcription and healthcare documentation services.",
    foundedYear: 2010,
    logo: {
      main: "/images/DigiscribeLogoRB.png",
      alt: "DigiScribe Transcription Corp."
    }
  },

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

  officeHours: {
    weekdays: "Monday - Saturday: 7:00 AM - 6:00 PM",
    weekend: "Sunday: Closed",
    timezone: "Philippine Standard Time (PST)"
  },

  socialMedia: {
    linkedin: "#",
    facebook: "#",
    twitter: "#",
    instagram: "#"
  },

  images: {
    hero: {
      doctorImage: "/images/doctorhome.png",
      alt: "Healthcare Professional"
    },
    awardBanner: {
      image: "/images/awards.jpg",
      alt: "2023 APAC Insider Business Award"
    },
    awardsCarousel: [
      { src: "/images/awards/BESTSTARTUP-NEW.png", alt: "Best Award" },
      { src: "/images/awards/PACINSIDER-NEW.png", alt: "APAC Insider" },
      { src: "/images/awards/INFOISINFO-NEW.png", alt: "Info Award" },
      { src: "/images/awards/PRLOG-NEW.png", alt: "PR Log" }
    ],
    projects: {
      practiceFusion1: "/images/practice_fusion_1.png",
      practiceFusion2: "/images/practice_fusion_2.png",
      practiceFusion3: "/images/practice_fusion_3.png"
    }
  },

  services: {
    pageTitle: "Services We Offer",
    pageDescription: "Founded in 2005, Digiscribe Transcription Corp. has grown from a small transcription service into a leading provider of medical documentation and back-office solutions in the Philippines and beyond.",
    transcription: {
      title: "Transcription Support",
      shortTitle: "Transcription",
      icon: "fas fa-headset",
      cardImage: "/images/services/Tanscription%20Services/Medical%20Trans.jpg",
      accentColor: "primary",
      link: "/services/transcription",
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
    dataEntry: {
      title: "Data Entry",
      shortTitle: "Data Entry",
      icon: "fas fa-keyboard",
      cardImage: "/images/services/Data%20entry/Batch%20Proof%20Report.jpg",
      accentColor: "sky-600",
      link: "/services/data-entry",
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
    emr: {
      title: "EMR",
      shortTitle: "EMR",
      icon: "fas fa-laptop-medical",
      cardImage: "/images/services/EMR%20Services/Appointment%20Scheduling.png",
      accentColor: "emerald-600",
      link: "/services/emr",
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
    documentConversion: {
      title: "Document Conversion",
      shortTitle: "Doc Conversion",
      icon: "fas fa-file-export",
      cardImage: "/images/services/Documnt%20Conversion.png",
      accentColor: "violet-600",
      link: "/services/document-conversion",
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
    cad: {
      title: "CAD",
      shortTitle: "CAD",
      icon: "fas fa-drafting-compass",
      cardImage: "/images/services/CAD%20Service/2D%20Drafting.jpg",
      accentColor: "amber-600",
      link: "/services/cad",
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
    productListing: {
      title: "Product Listing",
      shortTitle: "Product Listing",
      icon: "fas fa-shopping-cart",
      cardImage: "/images/services/Data%20entry/Product%20Listing.jpg",
      accentColor: "rose-600",
      link: "/services/product-listing",
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

  hero: {
    title: "Medical Transcription and Healthcare Solutions Provider",
    subtitle: "Transforming healthcare documentation with accuracy, security, and efficiency.",
    primaryButton: { text: "Learn more about us", link: "/about" },
    secondaryButton: { text: "Get a Quote", link: "/quote" }
  },

  stats: {
    yearsExperience: "15+",
    clientsServed: "500+",
    documentsProcessed: "1M+",
    accuracy: "99.5%"
  },

  awards: {
    title: "2023 APAC Insider Business Award",
    description: "Digiscribe was honored with the 2023 APAC Insider Business Award for outstanding service quality, innovation, and client satisfaction across the region. Our relentless focus on accuracy, secure workflows, and rapid turnaround set a new benchmark for medical transcription.",
    subtitle: "South-East Asia BPO:",
    awardName: "Consultancy of the Year"
  },

  about: {
    mission: "To provide accurate, secure, and timely medical transcription services that empower healthcare providers to focus on patient care.",
    vision: "To be the leading medical transcription partner in the Asia-Pacific region, known for excellence and innovation.",
    values: [
      { icon: "fas fa-shield-alt", title: "Security", description: "HIPAA-compliant processes protecting patient data" },
      { icon: "fas fa-check-circle", title: "Accuracy", description: "99.5% accuracy rate on all documentation" },
      { icon: "fas fa-clock", title: "Timeliness", description: "Fast turnaround without compromising quality" },
      { icon: "fas fa-users", title: "Partnership", description: "Dedicated support for every client" }
    ]
  },

  meta: {
    defaultTitle: "DigiScribe Transcription Corp. - Medical Transcription Services",
    titleSuffix: " - DigiScribe Transcription Corp.",
    description: "Professional medical transcription and healthcare documentation services. HIPAA compliant, 99.5% accuracy, fast turnaround.",
    keywords: "medical transcription, healthcare documentation, EMR management, claims processing, data entry, Philippines BPO"
  }
};
