import { Quote, Star } from "lucide-react";

import { landingContent, type LandingTestimonial } from "@/content/landing";
import type { ApprovedTestimonialCard } from "@/lib/data";
import { ScrollReveal } from "./scroll-reveal";

type Props = {
  /** Si hay testimonios aprobados en base de datos, sustituyen a los de ejemplo del contenido estático. */
  dbItems?: ApprovedTestimonialCard[];
};

export function Testimonials({ dbItems = [] }: Props) {
  const { testimonials } = landingContent;
  const items: LandingTestimonial[] =
    dbItems.length > 0
      ? dbItems.map((d) => ({ quote: d.quote, author: d.author, detail: d.detail }))
      : testimonials.items;

  if (items.length === 0) return null;

  return (
    <section className="landing-section landing-testimonials">
      <ScrollReveal>
        <div className="section-header">
          <p className="eyebrow">Testimonios</p>
          <h2 className="section-title">{testimonials.title}</h2>
        </div>
      </ScrollReveal>
      <div className="grid three landing-card-grid">
        {items.map((item, index) => (
          <ScrollReveal key={`${item.author}-${index}`} delay={index < 3 ? (index + 1) as 1 | 2 | 3 : undefined}>
            <blockquote className="testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <Quote size={20} aria-hidden className="testimonial-icon" />
              <p>&ldquo;{item.quote}&rdquo;</p>
              <footer>
                <strong>{item.author}</strong>
                {item.detail ? <span> — {item.detail}</span> : null}
              </footer>
            </blockquote>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
