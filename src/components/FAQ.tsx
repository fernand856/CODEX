import { faq } from '../data/content';
import { studio } from '../data/studio';
import { Icon } from './Icon';

export default function FAQ() {
  return <section className="faq-section" id="duvidas" aria-labelledby="faq-title"><div className="container faq-layout">
    <div className="faq-intro"><p className="eyebrow"><span>07 /</span> PERGUNTAS FREQUENTES</p><h2 className="section-title" id="faq-title">{studio.sections.faqTitle}</h2><p>{studio.sectionIntros.faq}</p><Icon name="star" className="faq-star" /></div>
    <div className="faq-items">{faq.map(item => <details className="faq-item" key={item.question}><summary>{item.question}<span><Icon name="plus" className="faq-plus" /><Icon name="minus" className="faq-minus" /></span></summary><p>{item.answer}</p></details>)}</div>
  </div></section>;
}
