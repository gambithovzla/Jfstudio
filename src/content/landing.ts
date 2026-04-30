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

const phone = "+51 999 000 000";
const whatsapp = "51999000000";

export const landingContent: LandingContent = {
  brand: {
    name: "JF Studio",
    tagline: "Estilismo y belleza por Johanna Figueredo",
    initials: "JF",
    logoUrl: null
  },
  hero: {
    eyebrow: "Salon de belleza",
    title: "Realza tu estilo en manos expertas",
    description:
      "Cortes, color, tratamientos y peinados con productos profesionales. Reserva en linea en menos de un minuto.",
    primaryCta: { label: "Reservar cita", href: "/reservar" },
    secondaryCta: { label: "Ver servicios", href: "#servicios" },
    imageUrl: null,
    imageAlt: "Salon JF Studio"
  },
  about: {
    title: "Sobre Johanna",
    paragraphs: [
      "Soy Johanna Figueredo, estilista profesional con mas de una decada acompanando a mis clientas en sus momentos mas importantes.",
      "En JF Studio encontraras un espacio calido donde cada servicio se piensa para resaltar tu personalidad. Trabajamos con marcas premium y tecnicas actualizadas para cuidar tu cabello y tu tiempo."
    ],
    portraitUrl: null,
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
          "Diseno de corte personalizado segun tu estilo de vida, secado y peinado con acabado profesional.",
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
          "Hidratacion profunda, keratina, botox capilar y nutricion para cabellos secos o danados.",
        highlight: "75 min"
      }
    ]
  },
  gallery: {
    title: "Trabajos recientes",
    description: "Inspirate con algunos de los looks creados en el estudio.",
    images: []
  },
  testimonials: {
    title: "Lo que dicen nuestras clientas",
    items: [
      {
        quote:
          "Salgo siempre encantada del estudio. Johanna escucha lo que quieres y suma su criterio para que el resultado sea perfecto.",
        author: "Maria F.",
        detail: "Cliente desde 2022"
      },
      {
        quote:
          "El mejor color que me he hecho. Atencion impecable, productos de primera y un trato muy calido.",
        author: "Camila R.",
        detail: "Color completo"
      },
      {
        quote: "Nunca habia disfrutado tanto un tratamiento. El cabello me quedo brillante por semanas.",
        author: "Lucia M.",
        detail: "Hidratacion profunda"
      }
    ]
  },
  location: {
    title: "Vistanos",
    address: "Av. Principal 123, Lima, Peru",
    mapsEmbedUrl: null,
    hours: ["Lunes a viernes: 9:00 - 18:00", "Sabado: 9:00 - 16:00", "Domingo: cerrado"],
    notes: "Atencion solo con reserva previa."
  },
  contact: {
    title: "Reserva o consulta",
    description:
      "Escribenos por WhatsApp para asesoria personalizada o reserva tu cita en linea.",
    phone,
    whatsapp,
    email: "hola@jfstudio.local",
    instagram: "https://instagram.com/jfstudio",
    tiktok: undefined,
    facebook: undefined
  }
};
