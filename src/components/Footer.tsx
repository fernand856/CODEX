import { studio } from '../data/studio';
import { Icon } from './Icon';

function safeUrl(value: string): string | null {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; }
}

export default function Footer({ onPlan }: { onPlan: () => void }) {
  const instagram = safeUrl(studio.instagramUrl);
  const map = studio.address ? safeUrl(studio.mapUrl) : null;
  const agency = safeUrl(studio.agencyUrl);
  const whatsapp = /^[1-9]\d{7,14}$/.test(studio.whatsappNumber) ? `https://wa.me/${studio.whatsappNumber}` : null;
  return <footer className="site-footer" id="contato"><div className="container">
    <div className="footer-invite"><div><p className="eyebrow">O PRÓXIMO CAPÍTULO</p><h2>O próximo traço<br /><em>é seu.</em></h2></div><button className="footer-plan" aria-label="Planejar minha tattoo" onClick={onPlan}><Icon name="arrow-up-right" /></button></div>
    <div className="footer-columns">
      <div><a className="brand footer-brand" href="#inicio"><span className="brand-word">{studio.studioName.replace(/\s+Tattoo Studio$/i, '')}<Icon name="star" /></span><span className="brand-sub">{studio.tagline}</span></a></div>
      <div><h3>ONDE NOS ENCONTRAR</h3><p>{studio.address || studio.locationNotice}</p>{studio.openingHours && <p>{studio.openingHours}</p>}{map && <a className="text-link" href={map} target="_blank" rel="noopener noreferrer">Como chegar<Icon name="arrow-up-right" /></a>}</div>
      <div><h3>VAMOS CONVERSAR</h3>{whatsapp ? <a className="footer-contact" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp<Icon name="arrow-up-right" /></a> : <p className="footer-demo-contact">{studio.contactNotice}</p>}{instagram && <a className="footer-contact" href={instagram} target="_blank" rel="noopener noreferrer">Instagram<Icon name="arrow-up-right" /></a>}<a className="footer-contact" href="#agenda">Planejar uma sessão<Icon name="arrow-up-right" /></a></div>
    </div>
    <div className="footer-bottom"><p>{studio.demoNotice}</p><span>TRAÇO — {new Date().getFullYear()}{studio.agencyName && <> · {agency ? <a href={agency} target="_blank" rel="noopener noreferrer">{studio.agencyName}</a> : studio.agencyName}</>}</span></div>
  </div></footer>;
}
