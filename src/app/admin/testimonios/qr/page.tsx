import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TestimonialQrPrintPage() {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const formUrl = `${base}/dejar-testimonio`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(formUrl)}`;

  return (
    <>
      <div className="page-header no-print">
        <div>
          <p className="eyebrow">Testimonios</p>
          <h1 className="title">QR para testimonios</h1>
          <p className="subtitle">Imprime esta página o guarda el código; al escanearlo se abre el formulario público.</p>
        </div>
        <Link className="btn secondary" href="/admin/testimonios">
          Volver al listado
        </Link>
      </div>

      <section
        className="card qr-print-root"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center",
          padding: "32px 24px"
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
          Johanna Figueredo Studio
        </p>
        <h2 style={{ margin: "0 0 16px", fontSize: "1.35rem", lineHeight: 1.25 }}>Cuéntanos cómo fue tu visita</h2>
        <p className="small muted" style={{ marginBottom: 20 }}>
          Escanea el código para dejar tu testimonio. Solo se publican mensajes aprobados por el equipo.
        </p>
        <img src={qrSrc} width={280} height={280} alt="Código QR al formulario de testimonios" style={{ display: "block", margin: "0 auto 16px" }} />
        <p style={{ margin: 0, fontSize: "0.78rem", wordBreak: "break-all", color: "#6b7280" }}>{formUrl}</p>
      </section>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .admin-layout aside,
          .admin-layout form[action="/api/auth/logout"] { display: none !important; }
          .admin-layout .page { padding-top: 8px !important; }
        }
      `}</style>
    </>
  );
}
