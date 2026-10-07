import { studio } from '../data/studio';
import { Icon } from './Icon';
import { asset } from '../lib/assets';

export default function Studio() {
  const [first, ...remaining] = studio.sections.studioTitle.split('. ');
  return <section className="studio-section" id="estudio" aria-labelledby="studio-title">
    <div className="container">
      <div className="studio-grid">
        <div className="studio-photos">
          {studio.studioImages.map((image, index) => <figure key={image.image} className={`studio-photo photo-${index + 1}`}><img src={asset(image.image)} alt={image.alt} width={index ? 550 : 750} height={index ? 650 : 950} loading="lazy" /><figcaption>{index ? 'ONDE A IDEIA COMEÇA' : 'O ESPAÇO / CONCEITO ILUSTRATIVO'}</figcaption></figure>)}
        </div>
        <div className="studio-copy">
          <p className="eyebrow"><span>05 /</span> O ESTÚDIO</p>
          <h2 className="section-title" id="studio-title">{first}{remaining.length > 0 && '.'}<br /><em>{remaining.join('. ')}</em></h2>
          <p>{studio.studioDescription}</p>
          <p>{studio.studioSupportText}</p>
          <a className="text-link" href="#agenda">Vamos conversar sobre sua ideia<Icon name="arrow-up-right" /></a>
        </div>
      </div>
      <div className="process-heading"><p className="eyebrow">DA IDEIA À PELE</p><span>Um passo de cada vez.</span></div>
      <ol className="process-list">{studio.process.map((step, index) => <li key={step}><span className="process-number">0{index + 1}</span><p>{step}</p><Icon name="arrow-right" /></li>)}</ol>
    </div>
  </section>;
}
