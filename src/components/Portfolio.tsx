import { useEffect, useMemo, useState } from 'react';
import { artists, styles, works } from '../data/content';
import { studio } from '../data/studio';
import { asset } from '../lib/assets';
import type { ArtistId, StyleId, TattooRequest } from '../types';
import { Lightbox } from './Lightbox';
import { Icon } from './Icon';
import './gallery.css';

export type PortfolioFilter = {
  style: StyleId | 'all';
  artist: ArtistId | 'all';
};

type PortfolioProps = {
  filter: PortfolioFilter;
  setFilter: (filter: PortfolioFilter) => void;
  onPlan: (preset: Partial<TattooRequest>) => void;
};

export function Portfolio({ filter, setFilter, onPlan }: PortfolioProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [openedWork, setOpenedWork] = useState<string | null>(null);
  const filteredWorks = useMemo(
    () => works.filter((work) =>
      (filter.style === 'all' || work.styleId === filter.style) &&
      (filter.artist === 'all' || work.artistId === filter.artist)),
    [filter.style, filter.artist],
  );

  useEffect(() => {
    setVisibleCount(6);
    setOpenedWork(null);
  }, [filter.style, filter.artist]);

  return (
    <section id="trabalhos" className="portfolio-section" aria-labelledby="portfolio-title">
      <div className="container">
        <div className="section-heading portfolio-heading">
          <div>
            <p className="eyebrow">01 / O QUE NOS MOVE</p>
            <h2 id="portfolio-title" className="section-title">{studio.sections.portfolioTitle}</h2>
          </div>
          <div className="portfolio-intro">
            <p>{studio.sectionIntros.portfolio}</p>
            <span className="portfolio-demo-label">{studio.portfolioNotice} · artistas fictícios</span>
          </div>
        </div>

        <div className="portfolio-toolbar">
          <div className="portfolio-style-filters" role="group" aria-label="Filtrar trabalhos por estilo">
            <button type="button" className={`portfolio-filter${filter.style === 'all' ? ' is-selected' : ''}`} aria-pressed={filter.style === 'all'} onClick={() => setFilter({ ...filter, style: 'all' })}>Todos</button>
            {styles.map((style) => (
              <button type="button" key={style.id} className={`portfolio-filter${filter.style === style.id ? ' is-selected' : ''}`} aria-pressed={filter.style === style.id} onClick={() => setFilter({ ...filter, style: style.id })}>{style.name}</button>
            ))}
          </div>
          <div className="portfolio-artist-filter">
            <label htmlFor="portfolio-artist">Artista</label>
            <select id="portfolio-artist" value={filter.artist} onChange={(event) => setFilter({ ...filter, artist: event.target.value as ArtistId | 'all' })}>
              <option value="all">Todos os artistas</option>
              {artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}
            </select>
          </div>
        </div>

        <p className="portfolio-result-count" role="status" aria-live="polite" aria-atomic="true">
          {filteredWorks.length === 1 ? '1 trabalho encontrado' : `${filteredWorks.length} trabalhos encontrados`}
          {filteredWorks.length > visibleCount ? ` · exibindo ${visibleCount}` : ''}
        </p>

        {filteredWorks.length > 0 ? (
          <div className="portfolio-grid">
            {filteredWorks.slice(0, visibleCount).map((work, index) => {
              const artist = artists.find((entry) => entry.id === work.artistId);
              const style = styles.find((entry) => entry.id === work.styleId);
              return (
                <figure className={`portfolio-work portfolio-work-${index % 6}`} key={work.id}>
                  <button type="button" className="portfolio-image-button" onClick={() => setOpenedWork(work.id)} aria-label={`Ampliar ${work.title}, ${style?.name}, ${work.bodyRegion}`} aria-haspopup="dialog">
                    <img src={asset(work.image)} alt={work.alt} width="700" height="900" loading="lazy" decoding="async" />
                    <span className="portfolio-enlarge"><Icon name="arrow-up-right" /></span>
                  </button>
                  <figcaption>
                    <div><h3>{work.title}</h3><p>{artist?.name} <span aria-hidden="true">/</span> {work.bodyRegion}</p></div>
                    <span className="portfolio-work-style">{style?.name}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <div className="portfolio-empty">
            <p className="eyebrow">OUTRAS POSSIBILIDADES</p>
            <h3>Ainda não há uma composição nessa combinação.</h3>
            <p>Experimente outro estilo ou conheça os trabalhos de todos os artistas.</p>
            <button type="button" className="button button-dark" onClick={() => setFilter({ style: 'all', artist: 'all' })}>Limpar filtros <Icon name="arrow-up-right" /></button>
          </div>
        )}

        {filteredWorks.length > visibleCount && (
          <div className="portfolio-more">
            <button type="button" className="button button-outline" onClick={() => setVisibleCount((count) => count + 6)}>Ver mais trabalhos <Icon name="arrow-up-right" /></button>
            <span>{filteredWorks.length - visibleCount} composições para descobrir</span>
          </div>
        )}
      </div>
      {openedWork && (
        <Lightbox works={filteredWorks} initialWorkId={openedWork} onClose={() => setOpenedWork(null)} onPlan={onPlan} />
      )}
    </section>
  );
}

export default Portfolio;
