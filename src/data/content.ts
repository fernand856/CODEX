import type { Artist, Style, Work } from '../types';

export const artists: Artist[] = [
  {
    id: 'caio',
    name: 'Lucas',
    specialty: 'Blackwork e geometria',
    bio: 'Explora o contraste entre áreas de preto, linhas e espaço livre. Seu olhar parte das formas para criar composições marcantes que acompanham o corpo.',
    image: '/images/artist-caio.webp',
    alt: 'Retrato ilustrativo de Lucas em um ambiente de criação.',
  },
  {
    id: 'nina',
    name: 'Nina Duarte',
    specialty: 'Fine line e botânica',
    bio: 'Encontra inspiração nos pequenos detalhes da natureza e nos desenhos leves. Trabalha a relação entre gesto, delicadeza e espaço para transformar referências em uma composição própria.',
    image: '/images/artist-nina.webp',
    alt: 'Retrato ilustrativo de Nina Duarte em um ambiente de criação.',
  },
  {
    id: 'rafael',
    name: 'Rafael Costa',
    specialty: 'Realismo e tradicional',
    bio: 'Combina um olhar para volumes e retratos com referências clássicas da tatuagem. Explora expressão, contraste e cor para construir peças com presença.',
    image: '/images/artist-rafael.webp',
    alt: 'Retrato ilustrativo de Rafael Costa em um ambiente de criação.',
  },
];

export const styles: Style[] = [
  { id: 'blackwork', name: 'Blackwork', description: 'Preto intenso, contraste e formas que ocupam o espaço.', image: '/images/work-01.webp' },
  { id: 'fine-line', name: 'Fine line', description: 'Linhas leves e detalhes que pedem um olhar de perto.', image: '/images/work-02.webp' },
  { id: 'realismo', name: 'Realismo', description: 'Volumes e texturas traduzidos em desenho sobre a pele.', image: '/images/work-03.webp' },
  { id: 'tradicional', name: 'Tradicional', description: 'Contornos marcados e uma linguagem de símbolos clássicos.', image: '/images/work-04.webp' },
];

const origin = 'Imagem gerada para demonstração; associação ao artista fictício apenas ilustrativa. Consulte ASSETS.md.';

export const works: Work[] = [
  { id: 'work-01', title: 'Entre sombras', image: '/images/work-01.webp', alt: 'Tatuagem ilustrativa de folhagem em preto com alto contraste na parte superior do braço.', artistId: 'caio', styleId: 'blackwork', bodyRegion: 'Braço', description: 'Folhas e áreas de preto constroem uma composição que acompanha o braço.', origin },
  { id: 'work-02', title: 'Jardim particular', image: '/images/work-02.webp', alt: 'Tatuagem ilustrativa de um ramo de oliveira com linhas finas na parte interna do antebraço.', artistId: 'nina', styleId: 'fine-line', bodyRegion: 'Antebraço', description: 'Um ramo de oliveira leve, desenhado com espaço entre linhas e pequenos detalhes.', origin },
  { id: 'work-03', title: 'Olhar selvagem', image: '/images/work-03.webp', alt: 'Tatuagem ilustrativa de leão em preto e cinza na parte superior do braço.', artistId: 'rafael', styleId: 'realismo', bodyRegion: 'Braço', description: 'Luz, sombra e textura dão presença ao olhar de um leão.', origin },
  { id: 'work-04', title: 'Rosa em contraste', image: '/images/work-04.webp', alt: 'Tatuagem ilustrativa tradicional de uma rosa vermelha com folhas no antebraço.', artistId: 'rafael', styleId: 'tradicional', bodyRegion: 'Antebraço', description: 'Uma rosa de contornos fortes encontra cor e contraste em uma composição clássica.', origin },
  { id: 'work-05', title: 'Forma em movimento', image: '/images/work-05.webp', alt: 'Tatuagem ilustrativa de um ornamento geométrico em preto sobre o ombro.', artistId: 'caio', styleId: 'blackwork', bodyRegion: 'Ombro', description: 'Geometria e espaço livre criam ritmo em uma composição que acompanha o ombro.', origin },
  { id: 'work-06', title: 'Folha leve', image: '/images/work-06.webp', alt: 'Tatuagem ilustrativa de folha de costela-de-adão em linhas finas sobre o ombro.', artistId: 'nina', styleId: 'fine-line', bodyRegion: 'Ombro', description: 'O recorte de uma folha se transforma em linhas delicadas e espaço livre.', origin },
  { id: 'work-07', title: 'Metamorfose', image: '/images/work-07.webp', alt: 'Tatuagem ilustrativa realista de borboleta em preto e cinza no antebraço.', artistId: 'rafael', styleId: 'realismo', bodyRegion: 'Antebraço', description: 'Texturas e sombras revelam os detalhes de uma borboleta em repouso.', origin },
  { id: 'work-08', title: 'Voo livre', image: '/images/work-08.webp', alt: 'Tatuagem ilustrativa tradicional de uma andorinha colorida sobre o ombro.', artistId: 'rafael', styleId: 'tradicional', bodyRegion: 'Ombro', description: 'Uma andorinha de contorno definido, com cor e movimento.', origin },
  { id: 'work-09', title: 'Fases e formas', image: '/images/work-09.webp', alt: 'Tatuagem ilustrativa de lua crescente, estrela e ornamento em preto no antebraço.', artistId: 'caio', styleId: 'blackwork', bodyRegion: 'Antebraço', description: 'Lua, estrela e linhas ornamentais constroem uma composição de contraste.', origin },
  { id: 'work-10', title: 'Jardim leve', image: '/images/work-10.webp', alt: 'Tatuagem ilustrativa de pequenas flores delicadas em linhas finas no tornozelo.', artistId: 'nina', styleId: 'fine-line', bodyRegion: 'Tornozelo', description: 'Pequenas flores criam um desenho leve que acompanha o tornozelo.', origin },
  { id: 'work-11', title: 'Entre folhas', image: '/images/work-11.webp', alt: 'Tatuagem ilustrativa realista de um olho cercado por folhagem na panturrilha.', artistId: 'rafael', styleId: 'realismo', bodyRegion: 'Panturrilha', description: 'Um olhar entre folhas combina profundidade, texturas naturais e sombra.', origin },
  { id: 'work-12', title: 'Flor e lâmina', image: '/images/work-12.webp', alt: 'Tatuagem ilustrativa tradicional de uma adaga com rosa na parte superior do braço.', artistId: 'rafael', styleId: 'tradicional', bodyRegion: 'Braço', description: 'Uma adaga e uma rosa encontram contornos precisos e cores clássicas.', origin },
];

export const faq = [
  { question: 'Como pedir um orçamento?', answer: 'Conte sua ideia no formulário, escolha suas preferências e revise o pedido. Com o contato configurado, você continua no WhatsApp para conversar sobre viabilidade, orçamento e atendimento; nesta demonstração, é possível visualizar e copiar a mensagem.' },
  { question: 'Posso conversar sobre a ideia antes de escolher um artista?', answer: 'Sim. Selecione “Quero ajuda para escolher” no pedido. A conversa pode ajudar a aproximar sua ideia de um estilo e de um artista.' },
  { question: 'Como escolher o tamanho e a região do corpo?', answer: 'Escolha uma referência aproximada ou marque que quer orientação. Tamanho, detalhes e composição podem ser discutidos com o artista antes de definir o projeto.' },
  { question: 'Posso levar referências?', answer: 'Sim. Você pode incluir um link no formulário e enviar imagens na conversa pelo WhatsApp. A referência orienta um projeto próprio, sem propor uma cópia do trabalho de outra pessoa.' },
  { question: 'Selecionar uma data no site confirma minha sessão?', answer: 'Na agenda do Lucas, a reserva é confirmada quando o site exibe um protocolo. O formulário de outros estilos registra apenas preferências. Orçamento e projeto dependem da conversa com o artista.' },
  { question: 'Como conversar sobre cobertura ou retoque?', answer: 'Descreva que deseja conversar sobre uma cobertura ou um retoque. O artista precisa avaliar o projeto e as referências para discutir as possibilidades; você pode compartilhar imagens durante a conversa.' },
];
