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
  studio: {
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
    name: "Johanna Figueredo Studio",
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
    imageUrl: "/images/johanna-portrait-alt.webp",
    imageAlt: "Johanna Figueredo"
  },
  about: {
    title: "Manos que escuchan, tijeras que transforman.",
    paragraphs: [
      "Soy Johanna Figueredo, estilista profesional con más de 12 años dedicada al arte del cabello. Me he formado con academias y educadores de reconocimiento internacional, entre ellos la Academia Nacional de Peluquería Integral (ANPI), Slik de Venezuela, Mounir y Wanessa Braga.",
      "Mi pasión por compartir conocimiento me ha llevado a participar como educadora en conferencias internacionales en Madrid, Argentina y Venezuela, difundiendo las últimas tendencias en laceados orgánicos y técnicas de vanguardia.",
      "Mi estudio nace de la idea de que cada clienta merece una experiencia personalizada — un espacio íntimo, sin prisas, donde tu estilo se piensa en conjunto y se ejecuta con técnica y cuidado."
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
      { src: "/images/gallery-01.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-02.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-04.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-05.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-06.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-07.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-12.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-13.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-16.webp", alt: "Trabajo realizado en JF Studio" },
      { src: "/images/gallery-17.webp", alt: "Trabajo realizado en JF Studio" }
    ]
  },
  studio: {
    title: "Nuestro estudio",
    description: "Un espacio cálido y cuidado, pensado para que te sientas como en casa.",
    images: [
      { src: "/images/gallery-09.webp", alt: "Interior de JF Studio" },
      { src: "/images/gallery-10.webp", alt: "Espacio de trabajo en JF Studio" },
      { src: "/images/gallery-11.webp", alt: "Detalle del estudio JF Studio" }
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
