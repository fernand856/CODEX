import { useState } from 'react';
import { styles } from '../data/content';
import { studio } from '../data/studio';
import { asset } from '../lib/assets';
import type { StyleId, TattooRequest } from '../types';
import { Icon } from './Icon';
import './gallery.css';

type StylesProps = {
  onFilter: (style: StyleId) => void;
  onPlan: (preset: Partial<TattooRequest>) => void;
};

export function Styles({ onFilter, onPlan }: StylesProps) {
  const [exploring, setExploring] = useState(false);
  const [language, setLanguage] = useState<'lines' | 'volume' | ''>('');
  const [presence, setPresence] = useState<'subtle' | 'strong' | ''>('');
  const suggestedId: StyleId | undefined = language && presence
    ? language === 'lines'
      ? presence === 'subtle' ? 'fine-line' : 'blackwork'
      : presence === 'subtle' ? 'realismo' : 'tradicional'
    : undefined;
  const suggestion = styles.find((style) => style.id === suggestedId);

  return (
    <section id="estilos" className="styles-section" aria-labelledby="styles-title">
      <div className="container">
        <div className="section-heading styles-heading">
          <div><p className="eyebrow">03 / POSSIBILIDADES</p><h2 id="styles-title" className="section-title">{studio.sections.stylesTitle}</h2></div>
          <p>{studio.sectionIntros.styles}</p>
        </div>
        <div className="styles-grid">
          {styles.map((style, index) => (
            <button className="style-option" type="button" key={style.id} onClick={() => onFilter(style.id)} title={`Explorar trabalhos de ${style.name}`}>
              <span className="style-image-wrap"><img src={asset(style.image)} alt={`Amostra ilustrativa do estilo ${style.name}`} width="500" height="620" loading="lazy" decoding="async" /><span className="style-index" aria-hidden="true">0{index + 1}</span></span>
              <span className="style-name">{style.name}<Icon name="arrow-up-right" /></span>
              <span className="style-description">{style.description}</span>
            </button>
          ))}
        </div>
        <div className="style-explorer">
          <div className="style-explorer-heading"><div><p className="eyebrow">SEM PRESSA PARA ESCOLHER</p><h3>Ainda não sei meu estilo.</h3></div><button type="button" className="button button-outline" aria-expanded={exploring} aria-controls="style-explorer-panel" onClick={() => setExploring((open) => !open)}>{exploring ? 'Fechar exploração' : 'Descobrir possibilidades'} <Icon name={exploring ? 'minus' : 'plus'} /></button></div>
            <div id="style-explorer-panel" className="style-explorer-panel" hidden={!exploring}>
              <div className="style-questions">
                <fieldset><legend><span>01</span> Qual linguagem chama sua atenção?</legend><div className="style-choice-row"><label><input type="radio" name="style-language" value="lines" checked={language === 'lines'} onChange={() => setLanguage('lines')} /><span>Traços e formas</span></label><label><input type="radio" name="style-language" value="volume" checked={language === 'volume'} onChange={() => setLanguage('volume')} /><span>Textura e volume</span></label></div></fieldset>
                <fieldset><legend><span>02</span> Que presença você imagina?</legend><div className="style-choice-row"><label><input type="radio" name="style-presence" value="subtle" checked={presence === 'subtle'} onChange={() => setPresence('subtle')} /><span>Sutil e delicada</span></label><label><input type="radio" name="style-presence" value="strong" checked={presence === 'strong'} onChange={() => setPresence('strong')} /><span>Marcante e expressiva</span></label></div></fieldset>
                <p className="style-explorer-disclaimer">São pistas visuais para explorar, não uma definição do seu estilo. Você pode mudar de ideia a qualquer momento.</p>
              </div>
              <div className="style-suggestion" aria-live="polite" aria-atomic="true">
                {suggestion ? <><img src={asset(suggestion.image)} alt={`Referência ilustrativa de ${suggestion.name}`} width="360" height="460" loading="lazy" /><div><p className="eyebrow">QUE TAL EXPLORAR</p><h4>{suggestion.name}?</h4><p>{suggestion.description}</p><button type="button" className="style-suggestion-link" onClick={() => onFilter(suggestion.id)}>Ver esse estilo <Icon name="arrow-up-right" /></button><button type="button" className="button button-dark" onClick={() => onPlan({ style: suggestion.id })}>Começar com essa ideia <Icon name="arrow-up-right" /></button></div></> : <p>Escolha uma opção em cada pergunta para encontrar uma direção visual.</p>}
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}

export default Styles;
