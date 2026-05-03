import { Car, Clock, MapPin } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

const TAXI_SERVICES = [
  {
    name: "Google Maps",
    getHref: (lat: number, lon: number) =>
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    className: "taxi-btn taxi-btn--maps",
  },
  {
    name: "Uber",
    getHref: (lat: number, lon: number) =>
      `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lon}&dropoff[nickname]=JF+Studio`,
    className: "taxi-btn taxi-btn--uber",
  },
  { name: "Cabify", getHref: () => "https://cabify.com/lima/solicitar-taxi", className: "taxi-btn" },
  { name: "Yango", getHref: () => "https://yango.com/", className: "taxi-btn" },
  { name: "InDriver", getHref: () => "https://indriver.com/", className: "taxi-btn" },
  { name: "DiDi", getHref: () => "https://web.didiglobal.com/pe/", className: "taxi-btn" },
  { name: "Beat", getHref: () => "https://thebeat.co/pe/es/", className: "taxi-btn" },
];

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
        {location.coordinates ? (
          <div className="taxi-section">
            <p className="field-label">
              <Car size={16} aria-hidden style={{ verticalAlign: "-3px", marginRight: 6 }} />
              Cómo llegar
            </p>
            <div className="taxi-links">
              {TAXI_SERVICES.map(({ name, getHref, className }) => (
                <a
                  key={name}
                  href={getHref(location.coordinates!.lat, location.coordinates!.lon)}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  {name}
                </a>
              ))}
            </div>
          </div>
        ) : null}
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
