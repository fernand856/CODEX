import { artists } from '../data/content';
import { studio } from '../data/studio';
import { asset } from '../lib/assets';
import type { ArtistId, TattooRequest } from '../types';
import { Icon } from './Icon';
import './gallery.css';

type ArtistsProps = {
  onViewWorks: (artistId: ArtistId) => void;
  onPlan: (preset: Partial<TattooRequest>) => void;
};

export function Artists({ onViewWorks, onPlan }: ArtistsProps) {
  return (
    <section id="artistas" className="artists-section" aria-labelledby="artists-title">
      <div className="container">
        <div className="section-heading artists-heading">
          <div>
            <p className="eyebrow">02 / QUEM DÁ FORMA</p>
            <h2 id="artists-title" className="section-title">{studio.sections.artistsTitle}</h2>
          </div>
          <p>{studio.sectionIntros.artists}</p>
        </div>
        <div className="artists-grid">
          {artists.map((artist, index) => (
            <article className="artist-profile" key={artist.id} aria-labelledby={`artist-${artist.id}`}>
              <div className="artist-portrait">
                <img src={asset(artist.image)} alt={artist.alt} width="640" height="800" loading="lazy" decoding="async" />
                <span className="artist-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="artist-name-line"><h3 id={`artist-${artist.id}`}>{artist.name}</h3><Icon name="arrow-up-right" /></div>
              <p className="artist-specialty">{artist.specialty}</p>
              <p className="artist-bio">{artist.bio}</p>
              <div className="artist-actions">
                <button type="button" className="artist-work-button" onClick={() => onViewWorks(artist.id)}>Ver trabalhos <Icon name="arrow-up-right" /></button>
                <button type="button" className="artist-session-button" onClick={() => onPlan({ artist: artist.id })}>Solicitar sessão <Icon name="arrow-right" /></button>
              </div>
            </article>
          ))}
        </div>
        <p className="artists-demo-note">Perfis e retratos ilustrativos, criados para apresentar a experiência do estúdio.</p>
      </div>
    </section>
  );
}

export default Artists;
