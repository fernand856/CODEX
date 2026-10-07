import type { CSSProperties } from 'react';

export type IconName = 'arrow-right' | 'arrow-up-right' | 'arrow-down' | 'close' | 'menu' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'check' | 'calendar' | 'copy' | 'plus' | 'minus' | 'star' | 'instagram' | 'whatsapp';
const paths: Record<IconName, string> = {
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  'arrow-up-right': 'M6 18 18 6M6 6h12v12',
  'arrow-down': 'M12 4v16m-6-6 6 6 6-6',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  'chevron-left': 'm15 5-7 7 7 7',
  'chevron-right': 'm9 5 7 7-7 7',
  'chevron-down': 'm5 9 7 7 7-7',
  check: 'm5 12 4 4L19 6',
  calendar: 'M5 4h14v16H5zM5 9h14M8 2v4M16 2v4M8 13h2M14 13h2M8 16h2',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  star: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 7h.01',
  whatsapp: 'M20 11.6a8 8 0 0 1-11.8 7L3 20l1.5-5A8 8 0 1 1 20 11.6zM8 8c0 4 4 7 7 7l1-2-3-1-1 1-2-2 1-1-1-3z',
};
export function Icon({name,className,style}:{name:IconName;className?:string;style?:CSSProperties}) {
  return <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
