import Link from "next/link";
import { Star } from "lucide-react";

import { approveTestimonialAction, rejectTestimonialAction } from "@/lib/actions";
import { getTestimonialsForAdmin } from "@/lib/data";
import { FlashMessage } from "@/components/flash-message";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ msg?: string }>;
};

const statusLabel = (s: string) =>
  s === "PENDING" ? "Pendiente" : s === "APPROVED" ? "Aprobado" : s === "REJECTED" ? "Rechazado" : s;

export default async function AdminTestimonialsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rows = await getTestimonialsForAdmin();

  return (
    <>
      <FlashMessage msg={params.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Testimonios</p>
          <h1 className="title">Mensajes de clientas</h1>
          <p className="subtitle">Aprueba solo testimonios reales; los rechazados no se muestran en la web.</p>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href="/admin/testimonios/qr">
            <Star size={17} aria-hidden />
            Imprimir QR
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">Aún no hay envíos.</div>
      ) : (
        <div className="grid">
          {rows.map((t) => (
            <article className="card" key={t.id}>
              <div className="card-header">
                <div>
                  <p className="small muted" style={{ marginBottom: 4 }}>
                    {statusLabel(t.status)} · {t.createdAt.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <h2 className="card-title">{t.authorName?.trim() || "Sin nombre"}</h2>
                  <p className="small muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Star size={14} fill="currentColor" aria-hidden />
                    {t.stars}/5
                  </p>
                </div>
                {t.status === "PENDING" ? (
                  <div className="button-row">
                    <form action={approveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="btn" type="submit">
                        Aprobar
                      </button>
                    </form>
                    <form action={rejectTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="btn secondary" type="submit">
                        Rechazar
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{t.body}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
