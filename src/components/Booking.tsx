import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArtistId, StyleId, TattooRequest, ValidationErrors } from '../types';
import { artists, styles, works } from '../data/content';
import { studio } from '../data/studio';
import { addDays, formatDate, getAvailability, reconcileDate, todayInSaoPaulo } from '../lib/dates';
import { buildMessage, buildWhatsAppUrl, initialRequest, validateIdea, validateReview, validateScheduling } from '../lib/request';
import { Icon } from './Icon';
import './booking.css';

type BookingProps = { preset: { value: Partial<TattooRequest>; key: number } | null };
const stepNames = ['Sua ideia', 'Atendimento', 'Revisão'];
const bodyRegions = ['Braço', 'Antebraço', 'Ombro', 'Costas', 'Peito', 'Perna', 'Tornozelo', 'Outra região', 'Quero orientação'];
const sizes = ['Pequena — até 10 cm', 'Média — de 10 a 20 cm', 'Grande — acima de 20 cm', 'Ainda não sei'];
const periodLabel = { morning: 'Manhã', afternoon: 'Tarde' };
const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function shiftMonth(value: string, delta: number) {
  const [year, month] = value.split('-').map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function FieldError({ name, errors }: { name: string; errors: ValidationErrors }) {
  return errors[name] ? <p className="booking-field-error" id={`booking-${name}-error`}>{errors[name]}</p> : null;
}

export function Booking({ preset }: BookingProps) {
  const [today, setToday] = useState(todayInSaoPaulo);
  const [request, setRequest] = useState<TattooRequest>({ ...initialRequest });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [month, setMonth] = useState(today.slice(0, 7));
  const [notice, setNotice] = useState('');
  const [message, setMessage] = useState('');
  const [copyNotice, setCopyNotice] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const observedDayRef = useRef(today);
  const appliedPresetRef = useRef<number | null>(null);
  const hasContact = /^[1-9]\d{7,14}$/.test(studio.whatsappNumber);
  const lastMonth = addDays(today, 59).slice(0, 7);

  useEffect(() => {
    const refresh = () => setToday(todayInSaoPaulo());
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const timer = window.setInterval(refresh, 60_000);
    refresh();
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (observedDayRef.current === today) return;
    observedDayRef.current = today;
    const updated = reconcileDate(request, today);
    if (updated.date !== request.date || updated.period !== request.period) {
      setRequest(updated);
      setNotice(request.date && !updated.date
        ? 'A agenda foi atualizada para o dia de hoje. Sua data anterior não está mais disponível; escolha outra preferência ou combine pelo WhatsApp.'
        : 'A agenda foi atualizada. Escolha um novo período disponível para sua preferência.');
      if (dialogRef.current?.open && request.scheduling === 'date') {
        dialogRef.current.close();
        setMessage('');
        setCopyNotice('');
        focusErrors(validateScheduling(updated, today), 1);
      }
    }
    setMonth(previous => previous < today.slice(0, 7) ? today.slice(0, 7) : previous > lastMonth ? lastMonth : previous);
  }, [today, lastMonth, request]);

  useEffect(() => {
    if (!preset || appliedPresetRef.current === preset.key) return;
    appliedPresetRef.current = preset.key;
    setRequest(previous => {
      const merged = { ...previous, ...preset.value };
      const next = reconcileDate(merged, today);
      if (merged.date && !next.date) setNotice('A data anterior não está disponível para este artista. Escolha outra preferência ou combine pelo WhatsApp.');
      return next;
    });
    setStep(0);
    setErrors({});
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  }, [preset, today]);

  const availability = useMemo(() => getAvailability(request.artist || 'help', today), [request.artist, today]);
  const availabilityByDate = useMemo(() => new Map(availability.map(item => [item.date, item.periods])), [availability]);
  const selectedPeriods = availabilityByDate.get(request.date) ?? [];
  const [calendarYear, calendarMonth] = month.split('-').map(Number);
  const firstWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const numberOfDays = new Date(calendarYear, calendarMonth, 0).getDate();

  function change<K extends keyof TattooRequest>(field: K, value: TattooRequest[K]) {
    setRequest(previous => ({ ...previous, [field]: value }));
    setErrors(previous => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function changeArtist(value: TattooRequest['artist']) {
    const currentDay = todayInSaoPaulo();
    setToday(currentDay);
    const next = reconcileDate({ ...request, artist: value }, currentDay);
    setNotice(request.date && !next.date
      ? 'A data anterior não está disponível para este artista. Escolha outra preferência ou combine pelo WhatsApp.'
      : request.period && !next.period
        ? 'O período anterior não está disponível para este artista. Escolha outro período para a data selecionada.'
        : '');
    setRequest(next);
    setErrors(previous => {
      const nextErrors = { ...previous };
      delete nextErrors.artist;
      delete nextErrors.date;
      delete nextErrors.period;
      return nextErrors;
    });
  }

  function focusErrors(nextErrors: ValidationErrors, targetStep: number) {
    setErrors(nextErrors);
    setStep(targetStep);
    requestAnimationFrame(() => {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`booking-${first}`)?.focus();
    });
  }

  function moveTo(nextStep: number) {
    setErrors({});
    setStep(nextStep);
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ block: 'nearest' });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  function advance() {
    const currentDay = todayInSaoPaulo();
    setToday(currentDay);
    const nextErrors = step === 0 ? validateIdea(request) : validateScheduling(request, currentDay);
    if (Object.keys(nextErrors).length) {
      focusErrors(nextErrors.artist && step === 1 ? validateIdea(request) : nextErrors, nextErrors.artist ? 0 : step);
      return;
    }
    moveTo(step + 1);
  }

  function submitRequest() {
    const currentDay = todayInSaoPaulo();
    setToday(currentDay);
    const currentRequest = reconcileDate(request, currentDay);
    if (currentRequest.date !== request.date || currentRequest.period !== request.period) {
      setRequest(currentRequest);
      setNotice('A agenda foi atualizada. Revise sua preferência de data e período antes de continuar.');
    }
    const ideaErrors = validateIdea(currentRequest);
    if (Object.keys(ideaErrors).length) return focusErrors(ideaErrors, 0);
    const schedulingErrors = validateScheduling(currentRequest, currentDay);
    if (Object.keys(schedulingErrors).length) return focusErrors(schedulingErrors, 1);
    const reviewErrors = validateReview(currentRequest);
    if (Object.keys(reviewErrors).length) return focusErrors(reviewErrors, 2);
    setErrors({});
    try {
      const builtMessage = buildMessage(currentRequest);
      if (hasContact) {
        const url = buildWhatsAppUrl(studio.whatsappNumber, currentRequest);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setMessage(builtMessage);
        setCopyNotice('');
        requestAnimationFrame(() => { if (!dialogRef.current?.open) dialogRef.current?.showModal(); });
      }
    } catch {
      // The calendar day can change between validation and message creation.
      // Recheck against the clock, without exposing personal data in logs.
      const latestDay = todayInSaoPaulo();
      setToday(latestDay);
      const updatedRequest = reconcileDate(currentRequest, latestDay);
      setRequest(updatedRequest);
      const latestErrors = validateScheduling(updatedRequest, latestDay);
      if (Object.keys(latestErrors).length) {
        setNotice('A agenda foi atualizada. Revise sua preferência de atendimento.');
        focusErrors(latestErrors, 1);
      } else {
        setErrors({ submit: 'Não foi possível preparar o pedido. Revise os dados e tente novamente.' });
        requestAnimationFrame(() => document.getElementById('booking-submit-error')?.focus());
      }
    }
  }

  async function copyMessage() {
    const currentDay = todayInSaoPaulo();
    setToday(currentDay);
    const currentRequest = reconcileDate(request, currentDay);
    const schedulingErrors = validateScheduling(currentRequest, currentDay);
    if (Object.keys(schedulingErrors).length) {
      setRequest(currentRequest);
      setNotice('A agenda foi atualizada. Revise sua preferência antes de copiar o pedido.');
      dialogRef.current?.close();
      focusErrors(schedulingErrors, 1);
      return;
    }
    try {
      if (!navigator.clipboard) throw new Error('Clipboard indisponível');
      await navigator.clipboard.writeText(message);
      setCopyNotice('Mensagem copiada. Você pode colá-la em uma conversa.');
    } catch {
      messageRef.current?.focus();
      messageRef.current?.select();
      setCopyNotice('Cópia automática indisponível. O texto está selecionado: use Copiar no dispositivo ou Ctrl/Cmd + C.');
    }
  }

  function chooseDate(date: string) {
    const currentDay = todayInSaoPaulo();
    setToday(currentDay);
    const periods = getAvailability(request.artist || 'help', currentDay).find(item => item.date === date)?.periods;
    if (!periods?.length || date < currentDay) {
      setNotice('Esta data não está mais disponível. A agenda foi atualizada; escolha outra preferência.');
      return;
    }
    setMonth(date.slice(0, 7));
    setRequest(previous => ({
      ...previous,
      artist: previous.artist || 'help',
      scheduling: 'date',
      date,
      period: periods.includes(previous.period as 'morning' | 'afternoon') ? previous.period : '',
    }));
    setNotice(`${formatDate(date)} selecionado como preferência. Escolha manhã ou tarde; a sessão ainda não está confirmada.`);
    setErrors(previous => {
      const next = { ...previous };
      delete next.date;
      delete next.period;
      return next;
    });
  }

  function fieldAccessibility(name: string, hint?: string) {
    return {
      'aria-invalid': !!errors[name],
      'aria-describedby': [hint, errors[name] ? `booking-${name}-error` : ''].filter(Boolean).join(' ') || undefined,
    };
  }

  const referenceTitle = works.find(work => work.id === request.referenceWork)?.title ?? request.referenceWork;
  const styleName = styles.find(item => item.id === request.style)?.name ?? (request.style === 'undecided' ? 'Ainda não sei' : 'Não escolhido');
  const artistName = artists.find(item => item.id === request.artist)?.name ?? (request.artist === 'help' ? 'Quero ajuda para escolher' : 'Não escolhido');
  const dateSummary = request.scheduling === 'date' && request.date
    ? `${formatDate(request.date)}${request.period ? ` · ${periodLabel[request.period]}` : ''}`
    : 'Combinar pelo WhatsApp';
  const summary = [
    { label: 'Estilo', value: styleName, step: 0, field: 'style' },
    { label: 'Artista', value: artistName, step: 0, field: 'artist' },
    { label: 'Região do corpo', value: request.bodyRegion, step: 0, field: 'bodyRegion' },
    { label: 'Tamanho', value: request.size, step: 0, field: 'size' },
    { label: 'Sua ideia', value: request.description.trim(), step: 0, field: 'description' },
    { label: 'Link de referência', value: request.referenceUrl.trim() || 'Não informado', step: 0, field: 'referenceUrl' },
    ...(request.referenceWork ? [{ label: 'Referência do portfólio', value: referenceTitle, step: 0, field: 'referenceWork' }] : []),
    { label: 'Data e período', value: dateSummary, step: 1, field: 'scheduling' },
    { label: 'Orçamento', value: request.budget.trim() || 'Prefiro conversar', step: 1, field: 'budget' },
  ];

  return <section className="booking-section" id="agenda" aria-labelledby="booking-title">
    <div className="container">
      <div className="booking-section-heading">
        <p className="eyebrow">05 / SUA PRÓXIMA TATUAGEM</p>
        <h2 className="section-title" id="booking-title">{studio.sections.bookingTitle.includes('do papel?') ? <>{studio.sections.bookingTitle.replace('do papel?', '').trim()}<br /><em>do papel?</em></> : studio.sections.bookingTitle}</h2>
        <p>{studio.sectionIntros.booking}</p>
      </div>

      <div className="booking-layout">
        <aside className="booking-calendar-panel" aria-labelledby="calendar-title">
          <div className="booking-calendar-topline"><span className="booking-small-tag">AGENDA DEMONSTRATIVA</span><Icon name="calendar" /></div>
          <h3 id="calendar-title">Encontre um dia<br /><em>para começar.</em></h3>
          <p className="booking-calendar-intro">Datas fictícias para explorar o atendimento. Sua escolha é uma preferência, sujeita à conversa com o estúdio.</p>
          <label htmlFor="booking-calendar-artist">Ver agenda do artista</label>
          <select id="booking-calendar-artist" value={request.artist} onChange={event => changeArtist(event.target.value as ArtistId | 'help' | '')}>
            <option value="">Escolha um artista</option>
            <option value="help">Quero ajuda para escolher</option>
            {artists.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}
          </select>

          <div className="booking-calendar-month">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} disabled={month <= today.slice(0, 7)} aria-label="Ver mês anterior"><Icon name="chevron-left" /></button>
            <h4 aria-live="polite">{monthNames[calendarMonth - 1]} <span>{calendarYear}</span></h4>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= lastMonth} aria-label="Ver próximo mês"><Icon name="chevron-right" /></button>
          </div>
          <div className="booking-calendar-weekdays" aria-hidden="true">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={index}>{day}</span>)}</div>
          <div className="booking-calendar-grid" role="group" aria-label={`Agenda demonstrativa de ${monthNames[calendarMonth - 1]} de ${calendarYear}. Dias indisponíveis estão desativados.`}>
            {Array.from({ length: firstWeekday }, (_, index) => <span className="booking-calendar-space" key={`empty-${index}`} />)}
            {Array.from({ length: numberOfDays }, (_, index) => {
              const date = `${month}-${String(index + 1).padStart(2, '0')}`;
              const available = !!request.artist && date >= today && availabilityByDate.has(date);
              const selected = request.scheduling === 'date' && request.date === date;
              return <button type="button" key={date} disabled={!available} className={`booking-day${selected ? ' is-selected' : ''}`} aria-label={`${formatDate(date)}: ${selected ? 'selecionado como preferência' : available ? 'disponível na demonstração' : 'indisponível'}`} aria-pressed={selected} onClick={() => chooseDate(date)}>
                <span>{String(index + 1).padStart(2, '0')}</span><span className="booking-day-mark" aria-hidden="true">{selected ? '✓' : available ? '·' : '—'}</span>
              </button>;
            })}
          </div>
          <div className="booking-calendar-legend"><span><i />Disponível</span><span><i className="is-unavailable" />Sem previsão</span></div>
          {!request.artist && <p className="booking-calendar-hint">Escolha um artista para ver os dias disponíveis.</p>}
          {request.scheduling === 'date' && request.date && <div className="booking-calendar-selected">
            <p><strong>{formatDate(request.date)}</strong><span>Preferência de período</span></p>
            <div className="booking-periods" role="group" aria-label="Período de preferência">
              {selectedPeriods.map(period => <button type="button" key={period} aria-pressed={request.period === period} className={request.period === period ? 'is-selected' : ''} onClick={() => change('period', period)}>{periodLabel[period]}</button>)}
            </div>
          </div>}
          <p className="booking-live-notice" aria-live="polite">{notice}</p>
          <p className="booking-calendar-footnote">Agenda demonstrativa · horários e projetos serão alinhados na conversa.</p>
        </aside>

        <div className="booking-form-panel">
          <ol className="booking-progress" aria-label={`Pedido de sessão: etapa ${step + 1} de 3`}>
            {stepNames.map((name, index) => <li key={name} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}>
              {index < step ? <button type="button" onClick={() => moveTo(index)} aria-label={`Voltar à etapa ${index + 1}: ${name}`}><span>{String(index + 1).padStart(2, '0')}</span>{name}</button> : <span><b>{String(index + 1).padStart(2, '0')}</b>{name}</span>}
            </li>)}
          </ol>
          <form className="booking-form" noValidate onSubmit={event => { event.preventDefault(); step < 2 ? advance() : submitRequest(); }}>
            <div className="booking-step-heading"><p className="booking-step-count">ETAPA {String(step + 1).padStart(2, '0')} / 03</p><h3 ref={headingRef} tabIndex={-1}>{['Conte o que você imagina.', 'Uma preferência, sem pressa.', 'Sua ideia, pronta para conversar.'][step]}</h3><p>{['Não precisa ter tudo decidido. Seu artista ajuda a transformar referências em um projeto próprio.', 'Você pode escolher um dia na agenda demonstrativa ou deixar a data para a conversa.', 'Confira os detalhes. O próximo passo é conversar com o estúdio sobre a viabilidade do projeto.'][step]}</p></div>

            {step === 0 && <div className="booking-fields">
              <div className="booking-field"><label htmlFor="booking-style">Estilo <span>Obrigatório</span></label><select id="booking-style" value={request.style} onChange={event => change('style', event.target.value as StyleId | 'undecided' | '')} {...fieldAccessibility('style')} required><option value="">Escolha um estilo</option>{styles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}<option value="undecided">Ainda não sei</option></select><FieldError name="style" errors={errors} /></div>
              <div className="booking-field"><label htmlFor="booking-artist">Artista <span>Obrigatório</span></label><select id="booking-artist" value={request.artist} onChange={event => changeArtist(event.target.value as ArtistId | 'help' | '')} {...fieldAccessibility('artist')} required><option value="">Escolha seu artista</option>{artists.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}<option value="help">Quero ajuda para escolher</option></select><FieldError name="artist" errors={errors} /></div>
              <div className="booking-field"><label htmlFor="booking-bodyRegion">Região do corpo <span>Obrigatório</span></label><select id="booking-bodyRegion" value={request.bodyRegion} onChange={event => change('bodyRegion', event.target.value)} {...fieldAccessibility('bodyRegion')} required><option value="">Onde você imagina?</option>{bodyRegions.map(region => <option key={region}>{region}</option>)}</select><FieldError name="bodyRegion" errors={errors} /></div>
              <div className="booking-field"><label htmlFor="booking-size">Tamanho aproximado <span>Obrigatório</span></label><select id="booking-size" value={request.size} onChange={event => change('size', event.target.value)} {...fieldAccessibility('size')} required><option value="">Escolha uma ideia de tamanho</option>{sizes.map(size => <option key={size}>{size}</option>)}</select><FieldError name="size" errors={errors} /></div>
              <div className="booking-field booking-field-full"><label htmlFor="booking-description">Conte sua ideia <span>Obrigatório</span></label><textarea id="booking-description" rows={4} value={request.description} onChange={event => change('description', event.target.value)} placeholder="O que você gostaria de levar na pele? Conte sobre elementos, significado e referências." minLength={10} maxLength={1000} {...fieldAccessibility('description', 'booking-description-hint')} required /><div className="booking-field-meta" id="booking-description-hint"><span>De 10 a 1.000 caracteres.</span><span>{request.description.trim().length}/1.000</span></div><FieldError name="description" errors={errors} /></div>
              <div className="booking-field booking-field-full"><label htmlFor="booking-referenceUrl">Link de referência <span>Opcional</span></label><input id="booking-referenceUrl" type="url" value={request.referenceUrl} onChange={event => change('referenceUrl', event.target.value)} placeholder="https://" {...fieldAccessibility('referenceUrl', 'booking-reference-hint')} /><p className="booking-field-hint" id="booking-reference-hint">Você poderá enviar suas imagens de referência na conversa pelo WhatsApp.</p><FieldError name="referenceUrl" errors={errors} /></div>
              {request.referenceWork && <div className="booking-reference-note booking-field-full" id="booking-referenceWork" tabIndex={-1}><div><span>REFERÊNCIA DO PORTFÓLIO</span><strong>{referenceTitle}</strong><p>Esta referência orienta um projeto próprio, desenvolvido em conversa com o artista.</p></div><button type="button" onClick={() => change('referenceWork', '')} aria-label="Remover referência do portfólio"><Icon name="close" /></button></div>}
            </div>}

            {step === 1 && <div className="booking-scheduling">
              <fieldset id="booking-scheduling" tabIndex={-1}><legend>Como prefere combinar?</legend><label className={`booking-choice${request.scheduling === 'whatsapp' ? ' is-selected' : ''}`}><input type="radio" name="scheduling" value="whatsapp" checked={request.scheduling === 'whatsapp'} onChange={() => change('scheduling', 'whatsapp')} /><span><strong>Combinar pelo WhatsApp</strong><small>Conversamos sobre o projeto antes de escolher um dia.</small></span></label><label className={`booking-choice${request.scheduling === 'date' ? ' is-selected' : ''}`}><input type="radio" name="scheduling" value="date" checked={request.scheduling === 'date'} onChange={() => change('scheduling', 'date')} /><span><strong>Escolher uma preferência de data</strong><small>Explore a agenda demonstrativa e escolha um período.</small></span></label></fieldset>
              {request.scheduling === 'date' && <div className="booking-date-fields">
              <div className="booking-field"><label htmlFor="booking-date">Data demonstrativa <span>Obrigatório</span></label><select id="booking-date" value={request.date} onChange={event => event.target.value ? chooseDate(event.target.value) : setRequest(previous => ({ ...previous, date: '', period: '' }))} {...fieldAccessibility('date', 'booking-date-hint')}><option value="">Selecione uma data disponível</option>{availability.map(item => <option key={item.date} value={item.date}>{formatDate(item.date)}</option>)}</select><p className="booking-field-hint" id="booking-date-hint">Mesmas datas da agenda demonstrativa desta seção.</p><FieldError name="date" errors={errors} /></div>
                <div className="booking-field"><label htmlFor="booking-period">Período <span>Obrigatório</span></label><select id="booking-period" value={request.period} disabled={!request.date} onChange={event => change('period', event.target.value as TattooRequest['period'])} {...fieldAccessibility('period')}><option value="">Escolha o período</option>{selectedPeriods.map(period => <option key={period} value={period}>{periodLabel[period]}</option>)}</select><FieldError name="period" errors={errors} /></div>
              </div>}
              <div className="booking-field"><label htmlFor="booking-budget">Orçamento em mente <span>Opcional</span></label><input id="booking-budget" type="text" list="booking-budget-options" value={request.budget} onChange={event => change('budget', event.target.value)} placeholder="Prefiro conversar" maxLength={160} {...fieldAccessibility('budget', 'booking-budget-hint')} /><datalist id="booking-budget-options"><option value="Prefiro conversar" /></datalist><p className="booking-field-hint" id="booking-budget-hint">Se quiser, informe uma faixa. Cada projeto é avaliado pelo artista.</p><FieldError name="budget" errors={errors} /></div>
              <p className="booking-confirmation-note"><Icon name="calendar" /><span>A data e o orçamento serão confirmados pelo estúdio após avaliar sua ideia.</span></p>
            </div>}

            {step === 2 && <div className="booking-review">
              <div className="booking-field"><label htmlFor="booking-name">Como podemos chamar você? <span>Obrigatório</span></label><input id="booking-name" type="text" autoComplete="given-name" value={request.name} onChange={event => change('name', event.target.value)} placeholder="Seu nome" minLength={2} maxLength={80} {...fieldAccessibility('name', 'booking-name-hint')} required /><p className="booking-field-hint" id="booking-name-hint">Na demonstração, você pode usar um nome de exemplo.</p><FieldError name="name" errors={errors} /></div>
              <dl className="booking-summary">{summary.map(item => <div key={item.label}><dt>{item.label}</dt><dd><span>{item.value || 'Não informado'}</span><button type="button" onClick={() => { moveTo(item.step); requestAnimationFrame(() => document.getElementById(`booking-${item.field}`)?.focus()); }} aria-label={`Editar ${item.label.toLowerCase()}`}>Editar</button></dd></div>)}</dl>
              {!hasContact ? <p className="booking-demo-contact">{studio.contactNotice}</p> : <p className="booking-field-hint">Continuar abre o WhatsApp com o texto do pedido. Você revisa e decide enviar a mensagem. A sessão será combinada com o estúdio.</p>}
            </div>}

            <div className="booking-form-actions">{step > 0 && <button className="booking-back" type="button" onClick={() => moveTo(step - 1)}><Icon name="chevron-left" />Voltar</button>}<button className="button button-dark booking-next" type="submit" ref={step === 2 ? previewButtonRef : undefined}>{step < 2 ? 'Continuar' : hasContact ? 'Continuar no WhatsApp' : 'Visualizar pedido'}<Icon name="arrow-right" /></button></div>
            {errors.submit && <p className="booking-field-error" id="booking-submit-error" tabIndex={-1} role="alert">{errors.submit}</p>}
            <p className="booking-session-note">Seus dados ficam apenas nesta página enquanto ela estiver aberta.</p>
          </form>
        </div>
      </div>
    </div>

    <dialog className="booking-preview-dialog" ref={dialogRef} aria-labelledby="booking-preview-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} onClose={() => previewButtonRef.current?.focus()}>
      <div className="booking-preview-content"><button className="booking-dialog-close" type="button" aria-label="Fechar visualização do pedido" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button><p className="eyebrow">PRONTO PARA A CONVERSA</p><h2 id="booking-preview-title">Seu pedido, <em>em palavras.</em></h2><p>{studio.contactNotice} Você pode copiar o texto para conhecer o formato da mensagem.</p><label className="booking-preview-label" htmlFor="booking-message">Mensagem do pedido</label><textarea id="booking-message" ref={messageRef} value={message} readOnly rows={12} /><button className="button button-dark" type="button" onClick={() => void copyMessage()}><Icon name="copy" />Copiar mensagem</button><p className="booking-copy-status" role="status">{copyNotice}</p><p className="booking-preview-footnote">Visualizar ou copiar não envia mensagem nem confirma uma reserva.</p></div>
    </dialog>
  </section>;
}
