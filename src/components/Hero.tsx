import { studio } from '../data/studio';
import { Icon } from './Icon';
import { asset } from '../lib/assets';

export default function Hero({ onPlan }: { onPlan: () => void }) {
  const titleParts = studio.hero.title.split(',');
  return <section className="hero container" id="inicio" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow"><span className="small-dot" />{studio.hero.eyebrow}</p>
      <h1 id="hero-title">{titleParts[0]}{titleParts.length > 1 && ','}<br /><em>{titleParts.slice(1).join(',').trim()}</em></h1>
      <p className="hero-description">{studio.hero.description}</p>
      <div className="hero-actions">
        <button className="button button-dark" onClick={onPlan}>{studio.hero.primaryCta}<Icon name="arrow-up-right" /></button>
        <a className="text-link" href="#trabalhos">{studio.hero.secondaryCta}<Icon name="arrow-right" /></a>
      </div>
      <div className="hero-footnote"><span className="hero-line" /><span>SEU CORPO. SUA HISTÓRIA.<br />UM PROJETO SÓ SEU.</span></div>
    </div>
    <figure className="hero-figure">
      <div className="hero-image-wrap">
        <img src={asset(studio.hero.image)} alt={studio.hero.alt} width="760" height="1000" fetchPriority="high" />
        <span className="photo-index">ESTUDO Nº 01</span>
        <div className="hero-seal" aria-label={studio.tagline}><Icon name="star" /><span>{studio.tagline.toUpperCase()}</span><span className="seal-city">{studio.city.toUpperCase()}</span></div>
      </div>
      <figcaption><span>{studio.hero.caption}</span><span>01 / TRAÇO</span></figcaption>
    </figure>
  </section>;
}
