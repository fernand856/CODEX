import { useEffect, useRef, useState } from 'react';
import { artists, styles } from '../data/content';
import { asset } from '../lib/assets';
import type { TattooRequest, Work } from '../types';
import { Icon } from './Icon';

type LightboxProps = {
  works: Work[];
  initialWorkId: string;
  onClose: () => void;
  onPlan: (preset: Partial<TattooRequest>) => void;
};

export function Lightbox({ works, initialWorkId, onClose, onPlan }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, works.findIndex((work) => work.id === initialWorkId)));
  const work = works[currentIndex];
  const artist = artists.find((entry) => entry.id === work?.artistId);
  const style = styles.find((entry) => entry.id === work?.styleId);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  function navigate(direction: number) {
    setCurrentIndex((index) => (index + direction + works.length) % works.length);
  }

  if (!work) return null;

  return (
    <dialog ref={dialogRef} className="work-lightbox" aria-labelledby="lightbox-title" aria-describedby="lightbox-caption" onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
    }} onClick={(event) => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }
    }}>
      <div className="lightbox-close-wrap"><button ref={closeRef} type="button" className="lightbox-close" aria-label="Fechar imagem ampliada" onClick={onClose}><Icon name="close" /></button></div>
      <div className="lightbox-image-wrap">
        <img className="lightbox-image" src={asset(work.image)} alt={work.alt} width="900" height="1100" />
      </div>
      <div className="lightbox-information">
        <div className="lightbox-navigation">
          <p className="eyebrow" role="status" aria-live="polite" aria-atomic="true">{String(currentIndex + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')} TRABALHOS</p>
          <div>
            <button type="button" className="lightbox-arrow" aria-label="Trabalho anterior" onClick={() => navigate(-1)} disabled={works.length < 2}><Icon name="chevron-left" /></button>
            <button type="button" className="lightbox-arrow" aria-label="Próximo trabalho" onClick={() => navigate(1)} disabled={works.length < 2}><Icon name="chevron-right" /></button>
          </div>
        </div>
        <span className="lightbox-style">{style?.name}</span>
        <h2 id="lightbox-title">{work.title}</h2>
        <p id="lightbox-caption">{work.description}</p>
        <dl className="lightbox-meta">
          <div><dt>Artista demonstrativo</dt><dd>{artist?.name}</dd></div>
          <div><dt>Região</dt><dd>{work.bodyRegion}</dd></div>
        </dl>
        <p className="lightbox-demo">Portfólio ilustrativo. A referência orienta a criação de um projeto próprio, sem reproduzir a peça.</p>
        <button type="button" className="button button-light lightbox-plan" onClick={() => { onClose(); onPlan({ style: work.styleId, artist: work.artistId, referenceWork: work.id }); }}>Quero uma tattoo nesse estilo <Icon name="arrow-up-right" /></button>
        <p className="lightbox-keyboard-tip">Use as setas para explorar · Esc para fechar</p>
      </div>
    </dialog>
  );
}
