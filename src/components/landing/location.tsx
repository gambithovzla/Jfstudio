import { Clock, MapPin } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function Location() {
  const { location } = landingContent;

  return (
    <section className="landing-section landing-location" id="ubicacion">
      <ScrollReveal>
      <div className="landing-location-info">
        <p className="eyebrow">Donde encontrarnos</p>
        <h2 className="section-title">{location.title}</h2>
        <p className="lead lead-soft">
          <MapPin size={18} aria-hidden style={{ verticalAlign: "-3px", marginRight: 6 }} />
          {location.address}
        </p>
        <div className="hours-list">
          <p className="field-label">
            <Clock size={16} aria-hidden style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Horario de atención
          </p>
          <ul>
            {location.hours.map((hour) => (
              <li key={hour}>{hour}</li>
            ))}
          </ul>
          {location.notes ? <p className="small muted">{location.notes}</p> : null}
        </div>
      </div>
      </ScrollReveal>
      <ScrollReveal delay={1}>
      <div className="landing-location-map">
        {location.mapsEmbedUrl ? (
          <iframe
            title="Ubicación del estudio"
            src={location.mapsEmbedUrl}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="map-placeholder">
            <MapPin size={26} aria-hidden />
            <span className="small muted">Pronto cargaremos el mapa.</span>
          </div>
        )}
      </div>
      </ScrollReveal>
    </section>
  );
}
