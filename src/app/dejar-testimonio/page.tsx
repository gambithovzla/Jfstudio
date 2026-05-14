import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { submitTestimonialAction } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Dejar un testimonio",
  description: "Comparte tu experiencia en Johanna Figueredo Studio."
};

type PageProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

export default async function DejarTestimonioPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const banner =
    params.ok === "1" ? (
      <p
        className="static-lead"
        style={{
          background: "#dcfce7",
          border: "1px solid #86efac",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#166534"
        }}
      >
        Gracias por compartir tu experiencia.
      </p>
    ) : params.err === "required" ? (
      <p
        className="static-lead"
        style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#991b1b"
        }}
      >
        Escribe tu testimonio antes de enviar.
      </p>
    ) : params.err === "long" ? (
      <p
        className="static-lead"
        style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#991b1b"
        }}
      >
        El texto es demasiado largo (máximo 2000 caracteres).
      </p>
    ) : params.err === "name" ? (
      <p
        className="static-lead"
        style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#991b1b"
        }}
      >
        El nombre indicado es demasiado largo.
      </p>
    ) : params.err === "name_required" ? (
      <p
        className="static-lead"
        style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#991b1b"
        }}
      >
        Indica tu nombre para enviar el testimonio.
      </p>
    ) : params.err === "rate" ? (
      <p
        className="static-lead"
        style={{
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#92400e"
        }}
      >
        Has enviado varios mensajes en poco tiempo. Espera un momento e inténtalo de nuevo.
      </p>
    ) : null;

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
            <span>Testimonio</span>
          </nav>

          <header className="static-header">
            <p className="static-eyebrow">Tu opinión cuenta</p>
            <h1 className="static-title">
              Cuéntanos cómo fue <em>tu visita</em>
            </h1>
            <p className="static-lead">Indica tu nombre y cuéntanos cómo fue tu experiencia en el estudio.</p>
          </header>

          {banner}

          <div className="static-body">
            <form className="form-grid" action={submitTestimonialAction} style={{ maxWidth: 520 }}>
              <div className="field" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden>
                <label htmlFor="company">Empresa</label>
                <input className="input" id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="authorName">Nombre</label>
                <input
                  className="input"
                  id="authorName"
                  name="authorName"
                  type="text"
                  maxLength={120}
                  required
                  placeholder="Ej. María G."
                />
              </div>
              <div className="field">
                <label htmlFor="stars">Valoración</label>
                <select className="select" id="stars" name="stars" defaultValue="5">
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="body">Tu experiencia</label>
                <textarea
                  className="textarea"
                  id="body"
                  name="body"
                  required
                  rows={6}
                  maxLength={2000}
                  placeholder="Describe tu visita al estudio…"
                />
              </div>
              <button className="btn" type="submit">
                Enviar testimonio
              </button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
