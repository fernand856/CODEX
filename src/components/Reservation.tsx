import { useEffect, useRef, useState } from 'react';
import type { TattooRequest } from '../types';

type Slot = { time: string; available: boolean };
type Confirmation = { id: string; status: 'confirmed'; artist: string; style: string; date: string; time: string; timezone: string; durationMinutes: number };
const enabled = import.meta.env.MODE !== 'production';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const displayDate = (date: string) => date.split('-').reverse().join('/');
export function Reservation({ preset }: { preset: { value: Partial<TattooRequest>; key: number } | null }) {
  const [date, setDate] = useState('2026-10-15');
  const [time, setTime] = useState('14:00');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const submission = useRef<{ body: string; key: string } | null>(null);
  const receipt = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (preset?.value.date) setDate(preset.value.date);
  }, [preset]);
  useEffect(() => {
    if (!enabled) { setLoading(false); setError('A reserva online está disponível na versão com servidor. Esta página estática não consulta nem confirma horários.'); return; }
    const controller = new AbortController();
    setLoading(true); setError(''); setSlots([]);
    const query = new URLSearchParams({ artist: 'lucas', style: 'blackwork', date });
    fetch(`/api/availability?${query}`, { signal: controller.signal }).then(async response => {
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('A agenda precisa estar conectada ao servidor para consultar e confirmar reservas.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSlots(data.slots);
      setTime(previous => data.slots.some((slot: Slot) => slot.time === previous && slot.available) ? previous : '');
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message || 'Não foi possível consultar a agenda.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, refresh]);
  useEffect(() => { if (confirmation) receipt.current?.focus(); }, [confirmation]);
  async function reserve() {
    if (saving || confirmation || loading) return;
    if (!slots.some(slot => slot.time === time && slot.available)) { setError('Escolha um horário disponível.'); return; }
    const body = JSON.stringify({ artist: 'lucas', style: 'blackwork', date, time, name: name.trim(), contact: contact.trim() });
    if (submission.current?.body !== body) submission.current = { body, key: crypto.randomUUID() };
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': submission.current.key }, body });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('A confirmação exige conexão com o servidor da agenda.');
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) { setSlots(previous => previous.map(slot => slot.time === time ? { ...slot, available: false } : slot)); setTime(''); }
        throw new Error(data.error || 'Não foi possível confirmar. Tente novamente.');
      }
      setConfirmation(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha de conexão. Tente novamente com os mesmos dados.'); }
    finally { setSaving(false); }
  }
  return <section className="booking-section" id="agenda" aria-labelledby="reservation-title">
    <div className="container">
      <div className="booking-section-heading"><p className="eyebrow">AGENDE SEU PRÓXIMO TRAÇO</p><h2 className="section-title" id="reservation-title">Seu horário.<br /><em>Seu próximo traço.</em></h2><p>Lucas · Blackwork. Consulte a agenda e confirme um bloco de 2 horas. O orçamento e o projeto serão combinados com o artista.</p></div>
      <div className="booking-layout">
        <aside className="booking-calendar-panel"><h3>Lucas — Blackwork</h3><p>Terça a sábado · 10h às 18h<br />Horários de Brasília (America/Sao_Paulo).</p><p>A confirmação vale para o intervalo escolhido. A duração final da tatuagem depende da avaliação do artista.</p><a className="text-link" href="#pedido">Outro estilo ou artista? Conte sua ideia.</a></aside>
        <div className="booking-form-panel">
          {confirmation ? <div role="status"><h3 ref={receipt} tabIndex={-1}>Agendamento confirmado</h3><p>Lucas — Blackwork</p><p><strong>{displayDate(confirmation.date)} às {confirmation.time}</strong> · Brasília</p><p>Bloco reservado: {confirmation.durationMinutes} minutos.</p><p>Protocolo: <strong>{confirmation.id}</strong></p><p>Guarde este protocolo. A confirmação foi registrada na agenda; nenhum e-mail ou WhatsApp foi enviado.</p><button className="button" type="button" onClick={() => { setConfirmation(null); setTime(''); submission.current = null; setRefresh(value => value + 1); }}>Novo agendamento</button></div> :
          <form className="booking-form" onSubmit={event => { event.preventDefault(); void reserve(); }}>
            <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}><legend className="eyebrow">REVISE E CONFIRME</legend><div className="booking-fields">
              <div className="booking-field"><label htmlFor="reservation-artist">Artista</label><input id="reservation-artist" value="Lucas" readOnly /></div>
              <div className="booking-field"><label htmlFor="reservation-style">Estilo</label><input id="reservation-style" value="Blackwork" readOnly /></div>
              <div className="booking-field"><label htmlFor="reservation-date">Data</label><input id="reservation-date" type="date" value={date} min={today()} required onChange={event => { setDate(event.target.value); setTime(''); }} /></div>
              <div className="booking-field"><label htmlFor="reservation-time">Horário</label><select id="reservation-time" value={time} required disabled={loading || slots.length === 0} onChange={event => setTime(event.target.value)}><option value="">{loading ? 'Consultando agenda…' : 'Escolha um horário'}</option>{slots.map(slot => <option key={slot.time} value={slot.time} disabled={!slot.available}>{slot.time}{slot.available ? '' : ' — indisponível'}</option>)}</select></div>
              <div className="booking-field"><label htmlFor="reservation-name">Seu nome</label><input id="reservation-name" autoComplete="name" value={name} minLength={2} maxLength={80} required onChange={event => setName(event.target.value)} /></div>
              <div className="booking-field"><label htmlFor="reservation-contact">Telefone com DDD</label><input id="reservation-contact" type="tel" autoComplete="tel" value={contact} minLength={10} maxLength={25} required onChange={event => setContact(event.target.value)} /></div>
            </div></fieldset>
            <p className="booking-confirmation-note">Ao confirmar, seu nome e telefone serão armazenados para atender esta reserva. Confira a data e o horário antes de continuar.</p>
            <p role="alert" className="booking-field-error">{error}</p>
            {enabled && !loading && slots.length === 0 && <button type="button" className="booking-back" onClick={() => setRefresh(value => value + 1)}>Consultar novamente</button>}
            {!loading && slots.length > 0 && !slots.some(slot => slot.available) && <p>Não há horários livres nesta data. Escolha outro dia.</p>}
            <button className="button button-dark booking-next" disabled={saving || loading || !time || slots.length === 0} type="submit">{saving ? 'Confirmando…' : 'Confirmar agendamento'}</button>
          </form>}
        </div>
      </div>
    </div>
  </section>;
}
