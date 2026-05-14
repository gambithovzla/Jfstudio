import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { ARRIVAL_TOLERANCE_MINUTES, WEB_DEPOSIT_AMOUNT_PEN } from "@/lib/booking-rules";

export const metadata: Metadata = {
  title: "Política de cancelación",
  description: "Condiciones de cancelación, adelanto y puntualidad en Johanna Figueredo Studio.",
};

export default function CancelacionPage() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <div className="static-page-inner">
          <Link href="/" className="static-back">
            ← Volver al inicio
          </Link>

          <nav className="static-breadcrumb">
            <Link href="/">Inicio</Link>
            <span>·</span>
            <span>Política de cancelación</span>
          </nav>

          <header className="static-header">
            <p className="static-eyebrow">Información importante</p>
            <h1 className="static-title">
              Política de <em>cancelación</em> y adelanto
            </h1>
            <p className="static-lead">
              Para garantizar la mejor experiencia para todas nuestras clientas, te pedimos leer con atención estas condiciones antes de reservar.
            </p>
          </header>

          <div className="static-body">
            <section className="static-section">
              <h2>Adelanto de reserva en línea (S/ {WEB_DEPOSIT_AMOUNT_PEN})</h2>
              <p>
                La reserva web incluye un adelanto de <strong>S/ {WEB_DEPOSIT_AMOUNT_PEN}</strong> con comprobante de pago.
              </p>
              <p>
                Si <strong>tú cancelas</strong> la cita (anulas la reserva), ese adelanto <strong>no se devuelve</strong>, con independencia del tiempo de aviso.
              </p>
              <p>
                Si <strong>reagendas</strong> (cambias fecha u hora) desde tu enlace, <strong>no pierdes</strong> el adelanto: conservamos tu comprobante y el monto queda asociado a la nueva cita.
              </p>
            </section>

            <section className="static-section">
              <h2>Cancelación y reagendamiento con anticipación</h2>
              <p>
                Puedes <strong>cancelar</strong> o <strong>reagendar</strong> desde el enlace de tu correo de confirmación con al menos <strong>24 horas</strong> de anticipación respecto al horario de la cita.
              </p>
              <p>
                Para cancelar o consultar casos excepcionales, también puedes escribirnos por WhatsApp al{" "}
                <a href="https://wa.me/51921153808">+51 921 153 808</a>.
              </p>
            </section>

            <section className="static-section">
              <h2>Puntualidad y tolerancia de llegada</h2>
              <p>
                La hora de tu cita es el momento acordado para comenzar. Cuentas con <strong>{ARRIVAL_TOLERANCE_MINUTES} minutos</strong> de tolerancia <strong>a partir de esa hora</strong> para presentarte en el salón.
              </p>
              <p>
                Si llegas fuera de ese margen, escríbenos por WhatsApp para ver si aún podemos atenderte en el tiempo disponible.
              </p>
            </section>

            <section className="static-section">
              <h2>Cancelación con menos de 24 horas</h2>
              <p>
                Si ya no es posible usar el enlace automático (menos de 24 horas antes), escríbenos por WhatsApp. El adelanto de S/ {WEB_DEPOSIT_AMOUNT_PEN} de la reserva web sigue sin ser reembolsable si la cancelación la pide la clienta; evaluamos emergencias reales caso a caso.
              </p>
            </section>

            <section className="static-section">
              <h2>Depósito en servicios largos (panel / presencial)</h2>
              <p>
                Para algunos servicios muy largos (por ejemplo laceado orgánico, mechas o color completo), el salón puede pedir un depósito distinto al de la web. Esas condiciones se te comunican al coordinar la cita.
              </p>
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
