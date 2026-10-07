import { useEffect, useRef, useState } from 'react';
import { studio } from '../data/studio';
import { Icon } from './Icon';

const links = [{ id: 'trabalhos', label: 'Trabalhos' }, { id: 'artistas', label: 'Artistas' }, { id: 'estudio', label: 'Estúdio' }, { id: 'agenda', label: 'Agenda' }];

export default function Header({ onPlan }: { onPlan: () => void }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    }
    const closeAtDesktop = () => { if (window.innerWidth > 900) setOpen(false); };
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', closeAtDesktop);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('resize', closeAtDesktop); };
  }, [open]);

  return <header className="site-header">
    <div className="container header-inner">
      <a className="brand" href="#inicio" title="Voltar ao início">
        <span className="brand-word">{studio.studioName.replace(/\s+Tattoo Studio$/i, '')}<Icon name="star" /></span>
        <span className="brand-sub">TATTOO STUDIO</span>
      </a>
      <nav className={`main-nav ${open ? 'is-open' : ''}`} id="main-nav" aria-label="Navegação principal" ref={nav}>
        {links.map(link => <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}>{link.label}</a>)}
        <button className="button button-dark nav-plan" onClick={() => { setOpen(false); onPlan(); }}>Planejar minha tattoo<Icon name="arrow-up-right" /></button>
      </nav>
      <button className="menu-toggle" ref={toggle} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(value => !value)}><Icon name={open ? 'close' : 'menu'} /></button>
    </div>
  </header>;
}
