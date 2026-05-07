import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas a las dudas más comunes sobre reservas, servicios y atención en Johanna Figueredo Studio.",
};

const FAQS = [
  {
    q: "¿Cómo reservo una cita?",
    a: "Puedes reservar en línea desde esta web en menos de un minuto — elige el servicio, la fecha y el horario disponible. También puedes escribirnos por WhatsApp al +51 921 153 808."
  },
  {
    q: "¿Puedo venir sin reserva previa?",
    a: "Trabajamos exclusivamente con reserva previa para garantizarte atención dedicada y sin esperas. Si hay disponibilidad en el día, te avisamos por WhatsApp."
  },
  {
    q: "¿Cuánto tiempo dura cada servicio?",
    a: "Los tiempos varían según el servicio: corte y peinado ~60 min, color global ~2–3 h, balayage ~3–4 h, keratina ~2–3 h, tratamientos ~90 min. Al reservar verás la duración exacta de cada opción."
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos efectivo, Yape, Plin y transferencia bancaria. Para servicios con depósito anticipado coordinamos el pago por transferencia o Yape."
  },
  {
    q: "¿Puedo combinar varios servicios en una misma cita?",
    a: "Sí. Al reservar puedes seleccionar más de un servicio y el sistema calculará automáticamente el tiempo y el costo total. También puedes consultarnos para armar un pack personalizado."
  },
  {
    q: "¿Con cuánta anticipación debo reservar?",
    a: "Para servicios de color y tratamientos recomendamos reservar con al menos 3–5 días de anticipación, especialmente los fines de semana. Para cortes puedes reservar con 1–2 días."
  },
  {
    q: "¿Hacen servicios a domicilio o en locaciones externas?",
    a: "Actualmente solo atendemos en el estudio (Av. José Larco 345, Miraflores). Para eventos especiales como bodas, contáctanos con anticipación y lo evaluamos."
  },
  {
    q: "¿Los productos que usan son seguros para cabellos sensibles o tratados?",
    a: "Sí. Trabajamos con marcas profesionales seleccionadas que minimizan el daño capilar. En la consulta previa al servicio te preguntaremos sobre el historial de tu cabello para elegir el tratamiento más adecuado."
  },
  {
    q: "¿Puedo llevar una referencia de foto?",
    a: "¡Por supuesto! Te recomendamos traer 2–3 fotos de referencia. Johanna las revisará contigo al inicio de la cita para asegurarse de que el resultado sea lo que imaginas."
  },
  {
    q: "¿Hay estacionamiento cerca?",
    a: "Hay varios estacionamientos públicos disponibles en los alrededores de Av. Larco. El más cercano está a media cuadra. También puedes llegar fácilmente en Uber (tienes el enlace directo en nuestra sección de ubicación)."
  },
  {
    q: "¿Cómo cancelo o reagendo mi cita?",
    a: "Usa el enlace de tu confirmación por email o escríbenos por WhatsApp. Recuerda hacerlo con al menos 24 horas de anticipación para evitar cargos. Más detalles en nuestra política de cancelación."
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <div className="static-page-inner">

          <Link href="/" className="static-back">← Volver al inicio</Link>

          <nav className="static-breadcrumb">
            <Link href="/">Inicio</Link>
            <span>·</span>
            <span>Preguntas frecuentes</span>
          </nav>

          <header className="static-header">
            <p className="static-eyebrow">FAQ</p>
            <h1 className="static-title">Preguntas <em>frecuentes</em></h1>
            <p className="static-lead">
              Todo lo que necesitas saber antes de tu primera visita. Si no encuentras tu respuesta aquí, escríbenos por WhatsApp.
            </p>
          </header>

          <div className="faq-list">
            {FAQS.map((item, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden>+</span>
                </summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="static-cta" style={{ marginTop: 48 }}>
            <p>¿Tienes otra pregunta?</p>
            <div className="button-row">
              <a href="https://wa.me/51921153808" target="_blank" rel="noreferrer" className="btn">
                Preguntar por WhatsApp
              </a>
              <Link href="/reservar" className="btn secondary">
                Reservar cita
              </Link>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
