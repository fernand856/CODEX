import { artists, styles, works } from '../data/content';
import type { TattooRequest, ValidationErrors } from '../types';
import { formatDate, getAvailability, isValidDate, todayInSaoPaulo } from './dates';

export const initialRequest: TattooRequest = {
  style: '', artist: '', bodyRegion: '', size: '', description: '', referenceUrl: '', referenceWork: '',
  scheduling: 'whatsapp', date: '', period: '', budget: '', name: '',
};

const textLength = (text: string) => Array.from(text.trim()).length;

export function validateIdea(request: TattooRequest): ValidationErrors {
  const errors: ValidationErrors = {};
  if (request.style !== 'undecided' && !styles.some(style => style.id === request.style)) {
    errors.style = 'Escolha um estilo ou selecione “Ainda não sei”.';
  }
  if (request.artist !== 'help' && !artists.some(artist => artist.id === request.artist)) {
    errors.artist = 'Escolha um artista ou peça ajuda para escolher.';
  }
  if (!request.bodyRegion.trim()) errors.bodyRegion = 'Escolha a região do corpo ou peça orientação.';
  else if (textLength(request.bodyRegion) > 120) errors.bodyRegion = 'Use até 120 caracteres para a região do corpo.';
  if (!request.size.trim()) errors.size = 'Informe um tamanho aproximado ou selecione “Ainda não sei”.';
  else if (textLength(request.size) > 100) errors.size = 'Use até 100 caracteres para o tamanho.';
  const descriptionLength = textLength(request.description);
  if (descriptionLength < 10 || descriptionLength > 1000) {
    errors.description = 'Conte sua ideia em 10 a 1.000 caracteres, sem contar os espaços nas extremidades.';
  }
  const referenceUrl = request.referenceUrl.trim();
  if (referenceUrl) {
    try {
      const url = new URL(referenceUrl);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || /\s/.test(referenceUrl) || url.username || url.password || referenceUrl.length > 2048) {
        errors.referenceUrl = 'Informe um link HTTP ou HTTPS válido, sem espaços ou credenciais.';
      }
    } catch {
      errors.referenceUrl = 'Informe um link completo e válido, começando por http:// ou https://.';
    }
  }
  if (request.referenceWork && !works.some(work => work.id === request.referenceWork)) {
    errors.referenceWork = 'Esta referência não está mais disponível. Escolha outra peça do portfólio.';
  }
  return errors;
}

export function validateScheduling(request: TattooRequest, today: string = todayInSaoPaulo()): ValidationErrors {
  const errors: ValidationErrors = {};
  if (textLength(request.budget) > 160) errors.budget = 'Use até 160 caracteres para sua preferência de orçamento.';
  if (request.scheduling === 'whatsapp') return errors;
  if (request.scheduling !== 'date') {
    errors.scheduling = 'Escolha uma data demonstrativa ou combine pelo WhatsApp.';
    return errors;
  }
  if (!request.artist || !artists.some(artist => artist.id === request.artist) && request.artist !== 'help') {
    errors.artist = 'Escolha um artista antes de consultar as datas.';
  }
  if (!isValidDate(request.date)) {
    errors.date = 'Escolha uma data demonstrativa disponível.';
  } else if (request.date < today) {
    errors.date = 'Escolha uma data a partir de hoje, no horário de São Paulo.';
  } else if (request.artist && !errors.artist) {
    const day = getAvailability(request.artist, today).find(slot => slot.date === request.date);
    if (!day) errors.date = 'Esta data não está disponível para o artista escolhido. Selecione outra.';
    else if (request.period && !day.periods.includes(request.period)) errors.period = 'Este período não está disponível nesta data.';
  }
  if (!['morning', 'afternoon'].includes(request.period)) errors.period = 'Escolha manhã ou tarde para sua preferência.';
  return errors;
}

export function validateReview(request: TattooRequest): ValidationErrors {
  const length = textLength(request.name);
  if (length < 2 || length > 80 || /[\r\n]/.test(request.name.trim())) {
    return { name: 'Informe seu nome em 2 a 80 caracteres, em uma única linha.' };
  }
  return {};
}

export function validateRequest(request: TattooRequest): ValidationErrors {
  return { ...validateIdea(request), ...validateScheduling(request), ...validateReview(request) };
}

export function buildMessage(request: TattooRequest): string {
  const errors = validateRequest(request);
  if (Object.keys(errors).length) throw new Error(`Revise o pedido antes de continuar: ${Object.keys(errors).join(', ')}.`);
  const style = styles.find(item => item.id === request.style)?.name ?? 'Ainda não sei';
  const artist = artists.find(item => item.id === request.artist)?.name ?? 'Quero ajuda para escolher';
  const reference = works.find(item => item.id === request.referenceWork);
  const period = request.period === 'morning' ? 'manhã' : 'tarde';
  const lines = [
    `Olá! Meu nome é ${request.name.trim()} e gostaria de conversar sobre uma tatuagem.`,
    '',
    `Estilo: ${style}`,
    `Artista: ${artist}`,
    `Região do corpo: ${request.bodyRegion.trim()}`,
    `Tamanho aproximado: ${request.size.trim()}`,
    `Ideia: ${request.description.trim()}`,
  ];
  if (reference) lines.push(`Referência do portfólio ilustrativo: ${reference.title} (${styles.find(item => item.id === reference.styleId)?.name}). A referência orienta um projeto próprio.`);
  if (request.referenceUrl.trim()) lines.push(`Referência: ${request.referenceUrl.trim()}`);
  lines.push(`Data/período de preferência: ${request.scheduling === 'whatsapp' ? 'Combinar pelo WhatsApp' : `${formatDate(request.date)} — ${period} (agenda demonstrativa)`}`);
  if (request.budget.trim()) lines.push(`Orçamento: ${request.budget.trim()}`);
  lines.push('', 'Gostaria de confirmar a viabilidade, o orçamento e a disponibilidade.');
  return lines.join('\n');
}

export function buildWhatsAppUrl(number: string, request: TattooRequest): string {
  // Only a client-supplied international phone number is accepted. No guessed
  // number, external request, automatic send, or persistent personal data.
  if (!/^[1-9]\d{7,14}$/.test(number)) throw new Error('Configure o WhatsApp com o número internacional, somente em dígitos (8 a 15).');
  const url = new URL(`https://wa.me/${number}`);
  url.search = new URLSearchParams({ text: buildMessage(request) }).toString();
  return url.toString();
}
