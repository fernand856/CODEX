import { useEffect, useState } from 'react';
import { studio } from './data/studio';
import type { ArtistId, StyleId, TattooRequest } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import { Portfolio, type PortfolioFilter } from './components/Portfolio';
import { Artists } from './components/Artists';
import { Styles } from './components/Styles';
import Studio from './components/Studio';
import { Booking } from './components/Booking';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { Icon } from './components/Icon';

function scrollToSection(id: string) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
}

export default function App() {
  const [filter, setFilter] = useState<PortfolioFilter>({ style: 'all', artist: 'all' });
  const [preset, setPreset] = useState<{ value: Partial<TattooRequest>; key: number } | null>(null);
  const plan = (value: Partial<TattooRequest> = {}) => {
    setPreset(previous => ({ value, key: (previous?.key ?? 0) + 1 }));
    scrollToSection('agenda');
  };
  const artistWorks = (artist: ArtistId) => {
    setFilter({ style: 'all', artist });
    scrollToSection('trabalhos');
  };
  const styleWorks = (style: StyleId) => {
    setFilter({ style, artist: 'all' });
    scrollToSection('trabalhos');
  };

  useEffect(() => {
    const theme = studio.theme;
    const tokens: Record<string, string> = {
      '--ink': theme.background, '--surface': theme.surface, '--paper': theme.ivory,
      '--accent': theme.accent, '--muted': theme.textMutedLight, '--muted-dark': theme.textMutedDark,
    };
    Object.entries(tokens).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    document.title = studio.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', studio.metaDescription);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', studio.pageTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', studio.metaDescription);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', studio.demoMode || !studio.productionContentApproved ? 'noindex, nofollow' : 'index, follow');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{ opacity: .7, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-heading, .studio-copy, .faq-intro').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <Header onPlan={() => plan()} />
    <main id="conteudo" tabIndex={-1}>
      <Hero onPlan={() => plan()} />
      <div className="style-ribbon" aria-label="Estilos disponíveis">
        <div className="container ribbon-inner">
          <span>Arte na pele.<br /><i>Com intenção.</i></span>
          {['Blackwork', 'Fine line', 'Realismo', 'Tradicional'].map(name => <span className="ribbon-style" key={name}><Icon name="star" />{name}</span>)}
        </div>
      </div>
      <Portfolio filter={filter} setFilter={setFilter} onPlan={plan} />
      <Artists onViewWorks={artistWorks} onPlan={plan} />
      <Styles onFilter={styleWorks} onPlan={plan} />
      <Studio />
      <Booking preset={preset} />
      <FAQ />
    </main>
    <Footer onPlan={() => plan()} />
  </>;
}
