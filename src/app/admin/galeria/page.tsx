import Image from "next/image";
import { ArrowDown, ArrowUp, Images, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashMessage } from "@/components/flash-message";
import {
  addLandingGalleryPathAction,
  addLandingGalleryUploadAction,
  deleteLandingGalleryImageAction,
  moveLandingGalleryImageAction,
  seedLandingGalleryFromTemplateAction,
  updateLandingGalleryAltAction
} from "@/lib/actions";
import { getLandingGalleryForAdmin } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ msg?: string }> };

export default async function AdminGaleriaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rows = await getLandingGalleryForAdmin();

  return (
    <>
      <FlashMessage msg={params.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Landing</p>
          <h1 className="title">Galería — Trabajos recientes</h1>
          <p className="subtitle">
            Las fotos que guardes aquí sustituyen a las del sitio público. Si borras todas las entradas, la web vuelve a
            mostrar las imágenes por defecto del proyecto. Las subidas se guardan en{" "}
            <code className="small">public/uploads/gallery</code> (en servidores de solo lectura necesitas volumen o
            despliegue con disco persistente).
          </p>
        </div>
      </div>

      <div className="grid two" style={{ marginBottom: 24 }}>
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Subir foto nueva</h2>
            <Images size={20} aria-hidden />
          </div>
          <form className="form-grid" action={addLandingGalleryUploadAction} encType="multipart/form-data">
            <div className="field">
              <label htmlFor="file">Archivo (JPG, PNG o WebP, máx. 8 MB)</label>
              <input className="input" id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            </div>
            <div className="field">
              <label htmlFor="alt">Texto alternativo (accesibilidad)</label>
              <input
                className="input"
                id="alt"
                name="alt"
                placeholder="Trabajo realizado en JF Studio"
                defaultValue="Trabajo realizado en JF Studio"
              />
            </div>
            <button className="btn" type="submit">
              Subir y publicar
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Añadir por ruta local</h2>
            <Images size={20} aria-hidden />
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>
            Útil si ya subiste el archivo a <code>public/images/</code> por despliegue o FTP. Ejemplo:{" "}
            <code>/images/gallery-01.webp</code>
          </p>
          <form className="form-grid" action={addLandingGalleryPathAction}>
            <div className="field">
              <label htmlFor="srcPath">Ruta</label>
              <input className="input" id="srcPath" name="srcPath" placeholder="/images/ejemplo.webp" required />
            </div>
            <div className="field">
              <label htmlFor="altPath">Texto alternativo</label>
              <input className="input" id="altPath" name="altPath" placeholder="Trabajo realizado en JF Studio" />
            </div>
            <button className="btn secondary" type="submit">
              Añadir sin subir archivo
            </button>
          </form>
        </section>
      </div>

      {rows.length === 0 ? (
        <section className="card">
          <p className="small muted" style={{ marginTop: 0 }}>
            Aún no hay fotos en la base de datos: la landing sigue usando las imágenes estáticas del código.
          </p>
          <form action={seedLandingGalleryFromTemplateAction} style={{ marginTop: 16 }}>
            <button className="btn secondary" type="submit">
              Importar las fotos por defecto del sitio a esta galería
            </button>
          </form>
        </section>
      ) : (
        <div className="grid">
          {rows.map((row, index) => (
            <article className="card" key={row.id}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 12
                }}
              >
                <Image src={row.src} alt={row.alt} fill sizes="400px" style={{ objectFit: "cover" }} />
              </div>
              <p className="small muted" style={{ margin: "0 0 8px", wordBreak: "break-all" }}>
                {row.src}
              </p>
              <form className="form-grid" action={updateLandingGalleryAltAction} style={{ marginBottom: 12 }}>
                <input type="hidden" name="id" value={row.id} />
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor={`alt-${row.id}`}>Descripción</label>
                  <input className="input" id={`alt-${row.id}`} name="alt" defaultValue={row.alt} required />
                </div>
                <button className="btn secondary" type="submit">
                  Guardar texto
                </button>
              </form>
              <div className="button-row" style={{ flexWrap: "wrap" }}>
                <form action={moveLandingGalleryImageAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="btn secondary" type="submit" disabled={index === 0} aria-label="Mover arriba">
                    <ArrowUp size={16} aria-hidden />
                  </button>
                </form>
                <form action={moveLandingGalleryImageAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="btn secondary" type="submit" disabled={index === rows.length - 1} aria-label="Mover abajo">
                    <ArrowDown size={16} aria-hidden />
                  </button>
                </form>
                <form action={deleteLandingGalleryImageAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmSubmitButton
                    className="btn danger"
                    type="submit"
                    message="¿Eliminar esta foto de la galería pública? Si la subiste desde aquí, también se borrará el archivo del servidor."
                  >
                    <Trash2 size={15} aria-hidden />
                    Eliminar
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
