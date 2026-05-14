"use client";

import { Calendar, CheckCircle2, Loader2, Scissors } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { isWeekendSalon } from "@/lib/booking-rules";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  requiresDeposit: boolean;
};

type Staff = {
  id: string;
  name: string;
  color: string;
};

type Slot = {
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string;
  label: string;
};

type BookingResult = {
  id: string;
  accessToken?: string;
  startAt: string;
  endAt: string;
  clientName: string;
  staffName: string;
  services: string[];
};

export function BookingForm({
  services,
  staff,
  currency,
  salonTimezone,
  initialServiceIds,
  replaceToken
}: {
  services: Service[];
  staff: Staff[];
  currency: string;
  salonTimezone: string;
  initialServiceIds?: string[];
  replaceToken?: string;
}) {
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds ?? []);
  const [staffId, setStaffId] = useState("any");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [birthdayStatus, setBirthdayStatus] = useState<"unknown" | "new" | "missing_birthday" | "has_birthday">("unknown");
  const [birthday, setBirthday] = useState("");
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "PASSPORT">("DNI");

  const isWeekendDate = useMemo(() => isWeekendSalon(date, salonTimezone), [date, salonTimezone]);

  useEffect(() => {
    if (isWeekendDate) {
      setStaffId("any");
    }
  }, [isWeekendDate]);
  const selectedServiceRows = useMemo(
    () => services.filter((service) => selectedServices.includes(service.id)),
    [selectedServices, services]
  );

  const total = selectedServiceRows.reduce((sum, service) => sum + service.price, 0);
  const duration = selectedServiceRows.reduce((sum, service) => sum + service.durationMinutes, 0);
  const selectedSlot = slots.find((slot) => `${slot.staffId}:${slot.startAt}` === selectedSlotKey);
  const requiresDeposit = selectedServiceRows.some((s) => s.requiresDeposit);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSlots() {
      setSelectedSlotKey("");
      setError("");

      if (selectedServices.length === 0 || !date) {
        setSlots([]);
        return;
      }

      setLoadingSlots(true);

      try {
        const params = new URLSearchParams({
          date,
          serviceIds: selectedServices.join(","),
          staffId
        });
        if (replaceToken) {
          params.set("replaceToken", replaceToken);
        }
        const response = await fetch(`/api/availability?${params.toString()}`, {
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "No se pudo cargar disponibilidad.");
        }

        setSlots(data.slots ?? []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar disponibilidad.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => controller.abort();
  }, [date, selectedServices, staffId, replaceToken]);

  async function checkBirthday(phone: string) {
    if (phone.length < 6) return;
    try {
      const res = await fetch(`/api/clients/birthday-check?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setBirthdayStatus(data.status ?? "unknown");
    } catch {
      // silent — birthday field just stays hidden
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedSlot) {
      setError("Selecciona un horario disponible.");
      return;
    }

    if (!replaceToken) {
      const voucherInput = event.currentTarget.querySelector<HTMLInputElement>('input[name="voucher"]');
      const f = voucherInput?.files?.[0];
      if (!f || f.size === 0) {
        setError("Adjunta el comprobante de pago del adelanto (S/ 50).");
        return;
      }
    }

    const formData = new FormData(event.currentTarget);

    // Honeypot: bots fill hidden fields, humans don't
    if (String(formData.get("_trap") ?? "").trim()) {
      setResult({ id: "", startAt: "", endAt: "", clientName: String(formData.get("name") ?? ""), staffName: "", services: [] });
      return;
    }

    setSubmitting(true);

    try {
      const bonusCodeRaw = String(formData.get("bonusCode") ?? "").trim();
      const birthdayRaw = String(formData.get("birthday") ?? "").trim();
      const documentNumberRaw = String(formData.get("documentNumber") ?? "").trim();
      const documentTypeRaw = String(formData.get("documentType") ?? "").trim();

      const payload = {
        client: {
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          ...(birthdayRaw ? { birthday: birthdayRaw } : {}),
          ...(documentNumberRaw
            ? { documentNumber: documentNumberRaw, documentType: documentTypeRaw || "DNI" }
            : {})
        },
        serviceIds: selectedServices,
        staffId: selectedSlot.staffId,
        startAt: selectedSlot.startAt,
        notes: String(formData.get("notes") ?? ""),
        ...(bonusCodeRaw ? { bonusCode: bonusCodeRaw } : {}),
        ...(replaceToken ? { replaceToken } : {})
      };

      const fd = new FormData();
      fd.set("_trap", String(formData.get("_trap") ?? ""));
      fd.set("payload", JSON.stringify(payload));
      if (!replaceToken) {
        const voucherInput = event.currentTarget.querySelector<HTMLInputElement>('input[name="voucher"]');
        const f = voucherInput?.files?.[0];
        if (f) fd.set("voucher", f);
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        body: fd
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo reservar.");
      }

      setResult(data.appointment);
      setSelectedServices([]);
      setSlots([]);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo reservar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">{replaceToken ? "Cita reagendada" : "Reserva confirmada"}</p>
            <h1 className="title">Lista, {result.clientName}</h1>
            <p className="subtitle">
              {result.services.join(", ")} con {result.staffName}
            </p>
          </div>
          <CheckCircle2 color="var(--brand)" size={34} aria-hidden />
        </div>
        <div className="button-row">
          {result.accessToken ? (
            <a className="btn" href={`/reserva/${result.accessToken}`}>
              Ver mi reserva
            </a>
          ) : (
            <button className="btn" type="button" onClick={() => setResult(null)}>
              Nueva reserva
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="grid two" onSubmit={submit}>
      {/* honeypot — invisible to humans, bots fill it */}
      <input name="_trap" type="text" tabIndex={-1} autoComplete="off" aria-hidden style={{ display: "none" }} />
      <section className="card form-grid">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1 className="title">Reserva tu cita</h1>
        </div>

        <div className="checkbox-list">
          {services.map((service) => (
            <label className="choice" key={service.id}>
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() => toggleService(service.id)}
              />
              <span style={{ display: "grid", gap: 2, width: "100%" }}>
                <strong>{service.name}</strong>
                <span className="small muted">
                  {service.durationMinutes} min · {formatCurrency(service.price, currency)}
                </span>
              </span>
            </label>
          ))}
        </div>

        {isWeekendDate ? (
          <div
            style={{
              background: "linear-gradient(135deg, #fdf4f8, #f5f2ed)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 4
            }}
          >
            <p className="field-label" style={{ marginBottom: 6 }}>
              Fin de semana
            </p>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a" }}>
              Equipo JF Studio
            </p>
            <p className="small muted" style={{ margin: "8px 0 0" }}>
              Los sabados y domingos el equipo atiende en conjunto; te asignamos un horario disponible sin elegir estilista.
            </p>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="staffId">Estilista</label>
            <select className="select" id="staffId" value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              <option value="any">Cualquiera disponible</option>
              {staff.map((staffMember) => (
                <option value={staffMember.id} key={staffMember.id}>
                  {staffMember.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="date">Fecha</label>
          <input className="input" id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="card" style={{ background: "var(--surface-soft)" }}>
          <div className="button-row" style={{ justifyContent: "space-between" }}>
            <span className="small muted">Total estimado</span>
            <strong>{formatCurrency(total, currency)}</strong>
          </div>
          <div className="button-row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span className="small muted">Duracion</span>
            <strong>{duration} min</strong>
          </div>
        </div>
      </section>

      <section className="card form-grid">
        <div className="card-header">
          <div>
            <p className="eyebrow">Horario</p>
            <h2 className="card-title">Elige una hora</h2>
          </div>
          {loadingSlots ? <Loader2 className="animate-spin" size={20} aria-hidden /> : <Calendar size={20} aria-hidden />}
        </div>

        <div className="slot-list">
          {!loadingSlots && slots.length === 0 ? (
            <div className="empty">Sin horarios para la seleccion actual.</div>
          ) : null}
          {(() => {
            const morningSlots = slots.filter((s) => parseInt(s.label.split(":")[0], 10) < 13);
            const visibleSlots = morningSlots.length > 0 ? morningSlots : slots;
            return visibleSlots.map((slot) => {
              const slotKey = `${slot.staffId}:${slot.startAt}`;
              return (
                <button
                  type="button"
                  key={slotKey}
                  className={`slot-button ${selectedSlotKey === slotKey ? "active" : ""}`}
                  onClick={() => setSelectedSlotKey(slotKey)}
                >
                  <strong>{slot.label}</strong>
                  <div className="small muted">{slot.staffName}</div>
                </button>
              );
            });
          })()}
        </div>

        <div className="grid two">
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input className="input" id="name" name="name" required minLength={2} />
          </div>
          <div className="field">
            <label htmlFor="phone">Telefono</label>
            <input
              className="input"
              id="phone"
              name="phone"
              required
              minLength={6}
              onBlur={(e) => checkBirthday(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Correo</label>
          <input className="input" id="email" name="email" type="email" />
        </div>
        <div className="grid two">
          <div className="field">
            <label htmlFor="documentType">Tipo de documento (opcional)</label>
            <select
              className="select"
              id="documentType"
              name="documentType"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as "DNI" | "CE" | "PASSPORT")}
            >
              <option value="DNI">DNI</option>
              <option value="CE">Carnet de extranjería</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="documentNumber">Número</label>
            <input
              className="input"
              id="documentNumber"
              name="documentNumber"
              autoComplete="off"
              placeholder="Opcional"
            />
          </div>
        </div>

        {(birthdayStatus === "new" || birthdayStatus === "missing_birthday") && (
          <div style={{ background: "#fdf4ff", border: "1px solid #d8b4fe", borderRadius: 10, padding: "14px 16px", display: "grid", gap: 8 }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, color: "#7e22ce" }}>
              {birthdayStatus === "new" ? "¡Bienvenida! Registra tu cumpleaños" : "Completa tu cumpleaños"}
            </p>
            <p style={{ fontSize: "0.82rem", color: "#6b21a8", margin: 0 }}>
              {birthdayStatus === "new"
                ? "Guardamos tu cumpleaños para celebrarte con beneficios exclusivos."
                : "Aun no tienes cumpleaños registrado. Agregalo y recibe sorpresas el dia de tu cumpleaños."}
            </p>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="birthday" style={{ color: "#7e22ce" }}>Fecha de cumpleaños</label>
              <input
                className="input"
                id="birthday"
                name="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor="bonusCode">Código de cumpleaños (opcional)</label>
          <input
            className="input"
            id="bonusCode"
            name="bonusCode"
            placeholder="Ej: JF-2026-AB12CD"
            style={{ textTransform: "uppercase" }}
          />
          <p className="small muted" style={{ marginTop: 4 }}>
            Si recibiste un bono de cumpleaños, ingresa tu código para aplicar el descuento.
          </p>
        </div>
        <div className="field">
          <label htmlFor="notes">Notas</label>
          <textarea className="textarea" id="notes" name="notes" />
        </div>

        {!replaceToken ? (
          <div
            className="field"
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 12,
              padding: "14px 16px"
            }}
          >
            <label htmlFor="voucher" style={{ fontWeight: 700 }}>
              Comprobante de adelanto (obligatorio) — S/ 50
            </label>
            <p className="small muted" style={{ margin: "6px 0 10px" }}>
              Adjunta captura o PDF de tu pago (Yape, Plin o transferencia). El comprobante se envia al equipo y queda guardado con tu reserva.
            </p>
            <input
              className="input"
              id="voucher"
              name="voucher"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
            />
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Ya registramos tu adelanto en la reserva anterior; no necesitas volver a adjuntar el comprobante.
          </p>
        )}

        {requiresDeposit ? (
          <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem" }}>
            <strong>Esta cita requiere un adelanto.</strong> Te contactaremos por WhatsApp para coordinar el pago antes de confirmar tu reserva.
          </div>
        ) : null}

        {error ? <p className="small" style={{ color: "var(--danger)" }}>{error}</p> : null}

        <button className="btn" type="submit" disabled={submitting || !selectedSlot}>
          {submitting ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <Scissors size={18} aria-hidden />}
          Confirmar reserva
        </button>
      </section>
    </form>
  );
}
