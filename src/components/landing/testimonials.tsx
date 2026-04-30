import { Quote } from "lucide-react";

import { landingContent } from "@/content/landing";

export function Testimonials() {
  const { testimonials } = landingContent;

  if (!testimonials.items.length) {
    return null;
  }

  return (
    <section className="landing-section landing-testimonials">
      <div className="section-header">
        <p className="eyebrow">Testimonios</p>
        <h2 className="section-title">{testimonials.title}</h2>
      </div>
      <div className="grid three landing-card-grid">
        {testimonials.items.map((item) => (
          <blockquote className="card testimonial-card" key={item.author}>
            <Quote size={22} aria-hidden className="testimonial-icon" />
            <p>&ldquo;{item.quote}&rdquo;</p>
            <footer>
              <strong>{item.author}</strong>
              {item.detail ? <span className="small muted"> - {item.detail}</span> : null}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
