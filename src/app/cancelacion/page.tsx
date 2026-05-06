import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Política de cancelación",
  description: "Condiciones de cancelación y reagendamiento de citas en Johanna Figueredo Studio.",
};

export default function CancelacionPage() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <div className="static-page-inner">

          <nav className="static-breadcrumb">
            <Link href="/">Inicio</Link>
            <span>·</span>
            <span>Política de cancelación</span>
          </nav>

          <header className="static-header">
            <p className="static-eyebrow">Información importante</p>
            <h1 className="static-title">Política de <em>cancelación</em></h1>
            <p className="static-lead">
              Para garantizar la mejor experiencia para todas nuestras clientas, te pedimos leer con atención estas condiciones antes de reservar.
            </p>
          </header>

          <div className="static-body">

            <section className="static-section">
              <h2>Cancelación con anticipación</h2>
              <p>Puedes cancelar o reagendar tu cita <strong>hasta 24 horas antes</strong> del horario reservado, sin ningún cargo adicional.</p>
              <p>Para cancelar: ingresa al enlace de confirmación que recibiste por email, o escríbenos por WhatsApp al <a href="https://wa.me/51921153808">+51 921 153 808</a>.</p>
            </section>

            <section className="static-section">
              <h2>Cancelación tardía</h2>
              <p>Las cancelaciones realizadas con <strong>menos de 24 horas de anticipación</strong> pueden generar un cargo del 30% del valor del servicio reservado, descontable en tu próxima visita.</p>
              <p>Entendemos que los imprevistos ocurren — si tienes una emergencia, escríbenos lo antes posible y lo evaluamos caso a caso.</p>
            </section>

            <section className="static-section">
              <h2>No-show (inasistencia sin aviso)</h2>
              <p>Si no se presenta a la cita sin previo aviso, se cobrará el <strong>50% del valor del servicio</strong> como compensación al tiempo reservado.</p>
              <p>Dos inasistencias consecutivas sin aviso pueden requerir un depósito anticipado para futuras reservas.</p>
            </section>

            <section className="static-section">
              <h2>Depósito en servicios largos</h2>
              <p>Para servicios que superan las 2 horas (color completo, keratina, peinado de novia), puede solicitarse un depósito del <strong>30% del precio</strong> al momento de confirmar la cita.</p>
              <p>Este depósito es reembolsable con aviso de cancelación con más de 24 horas de anticipación.</p>
            </section>

            <section className="static-section">
              <h2>Reagendamiento</h2>
              <p>Puedes mover tu cita a otra fecha y hora disponible <strong>sin costo</strong>, siempre que lo solicites con al menos 24 horas de anticipación.</p>
              <p>Para reagendar, usa el enlace de tu confirmación por email o contáctanos directamente.</p>
            </section>

            <section className="static-section">
              <h2>Retrasos</h2>
              <p>Si llegas con más de <strong>15 minutos de retraso</strong>, es posible que necesitemos ajustar el servicio o reagendar la cita para no afectar a otras clientas. Te avisaremos de inmediato.</p>
            </section>

            <div className="static-cta">
              <p>¿Tienes alguna duda sobre tu cita?</p>
              <div className="button-row">
                <a href="https://wa.me/51921153808" target="_blank" rel="noreferrer" className="btn">
                  Escribir por WhatsApp
                </a>
                <Link href="/reservar" className="btn secondary">
                  Reservar cita
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
