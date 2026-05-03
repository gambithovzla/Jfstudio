export type LandingService = {
  title: string;
  description: string;
  highlight?: string;
};

export type LandingTestimonial = {
  quote: string;
  author: string;
  detail?: string;
};

export type GalleryImage = {
  src: string;
  alt: string;
};

export type LandingContent = {
  brand: {
    name: string;
    tagline: string;
    initials: string;
    logoUrl: string | null;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    imageUrl: string | null;
    imageAlt: string;
  };
  about: {
    title: string;
    paragraphs: string[];
    portraitUrl: string | null;
    portraitAlt: string;
  };
  services: {
    title: string;
    description: string;
    items: LandingService[];
  };
  gallery: {
    title: string;
    description: string;
    images: GalleryImage[];
  };
  testimonials: {
    title: string;
    items: LandingTestimonial[];
  };
  location: {
    title: string;
    address: string;
    mapsEmbedUrl: string | null;
    coordinates?: { lat: number; lon: number };
    hours: string[];
    notes?: string;
  };
  contact: {
    title: string;
    description: string;
    phone: string;
    whatsapp: string;
    email: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  };
};

const phone = "+51 921 153 808";
const whatsapp = "51921153808";

export const landingContent: LandingContent = {
  brand: {
    name: "JF Studio",
    tagline: "Estilismo y belleza por Johanna Figueredo",
    initials: "JF",
    logoUrl: "/images/logo-jf.png"
  },
  hero: {
    eyebrow: "Salón de belleza",
    title: "Realza tu estilo en manos expertas",
    description:
      "Cortes, color, tratamientos y peinados con productos profesionales. Reserva en línea en menos de un minuto.",
    primaryCta: { label: "Reservar cita", href: "/reservar" },
    secondaryCta: { label: "Ver servicios", href: "#servicios" },
    imageUrl: "/images/johanna-hero.webp",
    imageAlt: "Johanna Figueredo trabajando en el estudio"
  },
  about: {
    title: "Sobre Johanna",
    paragraphs: [
      "Soy Johanna Figueredo, estilista profesional con más de una década acompañando a mis clientas en sus momentos más importantes.",
      "En JF Studio encontrarás un espacio cálido donde cada servicio se piensa para resaltar tu personalidad. Trabajamos con marcas premium y técnicas actualizadas para cuidar tu cabello y tu tiempo."
    ],
    portraitUrl: "/images/johanna-portrait.webp",
    portraitAlt: "Johanna Figueredo"
  },
  services: {
    title: "Servicios destacados",
    description:
      "Selecciona el servicio que mejor se adapte a ti. Puedes combinar varios al reservar.",
    items: [
      {
        title: "Corte y peinado",
        description:
          "Diseño de corte personalizado según tu estilo de vida, secado y peinado con acabado profesional.",
        highlight: "60 min"
      },
      {
        title: "Color y mechas",
        description:
          "Tintes, balayage, mechas californianas y reflejos. Productos premium con cuidado del cuero cabelludo.",
        highlight: "150 min"
      },
      {
        title: "Tratamientos capilares",
        description:
          "Hidratación profunda, keratina, bótox capilar y nutrición para cabellos secos o dañados.",
        highlight: "75 min"
      }
    ]
  },
  gallery: {
    title: "Trabajos recientes",
    description: "Inspírate con algunos de los looks creados en el estudio.",
    images: [
      { src: "/images/johanna-hero.webp", alt: "Johanna trabajando en el estudio" },
      { src: "/images/johanna-portrait.webp", alt: "Johanna Figueredo" },
      { src: "/images/johanna-portrait-alt.webp", alt: "Retrato profesional" },
      { src: "/images/johanna-seated.webp", alt: "Johanna en el estudio" },
      { src: "/images/johanna-conferencia.webp", alt: "Johanna en conferencia" },
    ]
  },
  testimonials: {
    title: "Lo que dicen nuestras clientas",
    items: [
      {
        quote:
          "Salgo siempre encantada del estudio. Johanna escucha lo que quieres y suma su criterio para que el resultado sea perfecto.",
        author: "María F.",
        detail: "Cliente desde 2022"
      },
      {
        quote:
          "El mejor color que me he hecho. Atención impecable, productos de primera y un trato muy cálido.",
        author: "Camila R.",
        detail: "Color completo"
      },
      {
        quote: "Nunca había disfrutado tanto un tratamiento. El cabello me quedó brillante por semanas.",
        author: "Lucía M.",
        detail: "Hidratación profunda"
      }
    ]
  },
  location: {
    title: "Visítanos",
    address: "Av. José Larco 345, Miraflores, Lima",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=Av+Jose+Larco+345+Miraflores+Lima+Peru&hl=es&output=embed",
    coordinates: { lat: -12.1259, lon: -77.0291 },
    hours: ["Lunes a domingo: 8:00 - 18:00"],
    notes: "Atención solo con reserva previa."
  },
  contact: {
    title: "Reserva o consulta",
    description:
      "Escríbenos por WhatsApp para asesoría personalizada o reserva tu cita en línea.",
    phone,
    whatsapp,
    email: "johastyle.07@gmail.com",
    instagram: "https://instagram.com/jfigueredo07",
    tiktok: "https://tiktok.com/@jfigueredo07",
    facebook: undefined
  }
};
