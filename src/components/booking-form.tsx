"use client";

import { Calendar, CheckCircle2, Loader2, Scissors } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  initialServiceIds,
  replaceToken
}: {
  services: Service[];
  staff: Staff[];
  currency: string;
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
  }, [date, selectedServices, staffId]);

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

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      const bonusCodeRaw = String(formData.get("bonusCode") ?? "").trim();
      const birthdayRaw = String(formData.get("birthday") ?? "").trim();
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            name: String(formData.get("name") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            email: String(formData.get("email") ?? ""),
            ...(birthdayRaw ? { birthday: birthdayRaw } : {})
          },
          serviceIds: selectedServices,
          staffId: selectedSlot.staffId,
          startAt: selectedSlot.startAt,
          notes: String(formData.get("notes") ?? ""),
          ...(bonusCodeRaw ? { bonusCode: bonusCodeRaw } : {}),
          ...(replaceToken ? { replaceToken } : {})
        })
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

        <div className="grid two">
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
          <div className="field">
            <label htmlFor="date">Fecha</label>
            <input className="input" id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
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
