# Personalização

Edite os dados, confira a página local e gere um novo build após cada conjunto de alterações. O site publicado contém os valores incorporados no build; alterar apenas o código-fonte depois do upload não atualiza a hospedagem.

## Marca, contatos e apresentação

O arquivo principal é `src/data/studio.ts`.

| Campo | Como preencher |
| --- | --- |
| `demoMode` | Começa em `true`. Mantenha assim enquanto houver estúdio, artistas, trabalhos ou agenda fictícios. |
| `productionContentApproved` | Começa em `false`. Ative somente após o responsável revisar e aprovar a identidade, os perfis, os assets, os contatos e o atendimento reais. |
| `studioName`, `tagline`, `city` | Nome, assinatura e cidade apresentados na página. |
| `hero`, `sections`, `sectionIntros`, `studioDescription`, `studioSupportText`, `process` | Abertura, títulos, introduções, apresentação do espaço e percurso do atendimento. |
| `theme` | Paleta aplicada à página; confira os contrastes após alterar as cores. |
| `whatsappNumber` | Número internacional com país e DDD: somente dígitos, de 8 a 15 caracteres, sem zero inicial. Deixe vazio se não houver contato autorizado. |
| `instagramUrl` | URL HTTPS do perfil real; vazia mantém o link oculto. |
| `address`, `openingHours`, `mapUrl` | Endereço, horários e link de localização fornecidos pelo cliente. Sem endereço real, mantenha o mapa oculto. |
| `siteUrl` | URL pública definitiva HTTPS, sem usuário/senha, parâmetros ou fragmento. Inclua a subpasta, quando houver. |
| `pageTitle`, `metaDescription`, `ogImage` | Título, descrição e imagem de compartilhamento da página. |
| `agencyName`, `agencyUrl` | Crédito e endereço da agência, se desejados e autorizados. |

Não coloque tokens, senhas ou credenciais neste arquivo: o front-end e seus dados são públicos. Não use números de telefone fictícios. Com o contato vazio, o fluxo mantém a revisão e a cópia manual da mensagem; com contato configurado, o clique do visitante abre o WhatsApp com o texto preparado, sem enviá-lo.

Os textos da marca e da página devem seguir o mesmo tom do conteúdo existente. Não adicione avaliações, resultados, prêmios, certificações ou práticas de atendimento sem informação verificável do cliente.

## Artistas, estilos e portfólio

Edite `src/data/content.ts`. Preserve identificadores consistentes: os trabalhos relacionam artista e estilo por esses identificadores, utilizados pelos filtros e pelo pedido.

- Para cada artista, troque nome, especialidade, bio e retrato; confirme a autorização de uso da imagem.
- Para cada trabalho, mantenha título, imagem, texto alternativo, artista, estilo, região do corpo, descrição e origem. A associação a um artista fictício é demonstrativa; não atribua uma fotografia de terceiros a um tatuador real.
- Nas descrições e perguntas frequentes, explique o atendimento acordado com o responsável. Regras de sinal, cancelamento, menores e cuidados de saúde não devem ser improvisadas.

O portfólio ilustrativo deve continuar identificado até que as imagens sejam substituídas por trabalhos reais autorizados. Atualize também os rótulos visíveis e `ASSETS.md` ao fazer essa troca.

## Fotografias e identidade visual

Coloque as imagens em `public/images/` e atualize os caminhos nos dados, seguindo o padrão `/images/arquivo.webp`. O helper `asset()`, em `src/lib/assets.ts`, adapta esses caminhos à base do Vite, inclusive em uma subpasta. Utilize WebP ou AVIF quando possível, comprima os arquivos e preserve enquadramentos adequados à área de exibição. Declare dimensões ou proporção para evitar deslocamentos durante o carregamento. A imagem principal deve carregar imediatamente; imagens abaixo da dobra podem usar carregamento tardio.

Descreva a imagem no texto alternativo sem repetir a legenda. Retratos e fotografias precisam de autorização de uso; imagens decorativas podem ter `alt` vazio. Registre arquivo, finalidade, origem, licença/atribuição e status em `ASSETS.md`. Evite depender de hotlinks.

Troque a paleta em `studio.theme`, no arquivo de configuração. Tipografia, espaçamento e layout geral ficam em `src/styles.css`; detalhes da galeria e do formulário ficam nas folhas de estilo junto dos componentes. Mantenha o contraste dos textos, o foco visível e as áreas de toque. Use no máximo duas famílias de fonte e prefira arquivos locais com licença adequada ou os fallbacks já definidos. Verifique as novas combinações no celular antes de publicar.

## Datas e pedido

`src/lib/dates.ts` concentra a fonte demonstrativa de disponibilidade. Ela usa o dia atual de `America/Sao_Paulo`, datas no formato `YYYY-MM-DD`, horizonte de aproximadamente 60 dias e resultados determinísticos. Alterar o artista exige revalidar a data selecionada. Evite converter uma data de calendário para UTC para exibi-la, pois isso pode mudar o dia.

O pedido continua sendo uma solicitação de conversa. A data e o orçamento precisam de confirmação pelo estúdio. Não transforme a seleção em reserva nem exiba confirmação de envio apenas porque um link foi aberto.

Para um cliente real, escolha uma destas opções:

1. Manter somente uma preferência de data, sem declarar disponibilidade.
2. Substituir a fonte demonstrativa por informações mantidas pelo estúdio, com atualização definida e indicação honesta do que a seleção significa.

Uma reserva automática é outra etapa do produto: precisa de banco de dados, validação no servidor, controle de concorrência para impedir horários duplicados, confirmação e gerenciamento. A versão atual não implementa esse serviço.

As regras de validação e a construção da mensagem ficam em `src/lib/request.ts`. O formulário preserva campos apenas durante a sessão da página. Não adicione nome, descrição ou referências a `localStorage`, logs ou analytics. Não solicite dados de saúde. Imagens de referência são enviadas na conversa pelo WhatsApp; o beta não implementa upload.

## Metadados e passagem para produção

Revise `pageTitle`, `metaDescription` e `ogImage` na configuração, junto ao conteúdo. O plugin de metadados em `vite.config.ts` aplica os textos ao HTML estático durante o build; não é necessário editar manualmente o título e a descrição de `index.html`. O favicon fica em `public/favicon.svg`.

Enquanto `demoMode` for `true` **ou** `productionContentApproved` for `false`, o build mantém `noindex, nofollow`. Isso evita apresentar o conceito como negócio real nos buscadores, sem impedir acesso público. A aprovação exige conteúdo verdadeiro e verificado pelo responsável; alterar a flag não faz essa revisão nem substitui dados fictícios.

O build gera canonical, `og:url`, `og:image` absoluto, `sitemap.xml` e JSON-LD `TattooParlor` somente quando todas estas condições forem atendidas:

- `demoMode: false` e `productionContentApproved: true`.
- `siteUrl` HTTPS válida, sem usuário/senha, parâmetros ou fragmento.
- `address` preenchido com o endereço real.
- `whatsappNumber` internacional válido, somente dígitos, de 8 a 15 caracteres e sem zero inicial.

No beta, esses artefatos de negócio ficam ausentes. Após configurar produção, confira o HTML e o sitemap de `dist/`, inclusive o domínio e o caminho da imagem de compartilhamento.

Desligar `demoMode` não torna os dados verdadeiros nem converte a agenda em disponibilidade real. Antes de retirar os avisos e permitir indexação, confirme:

- Identidade, fotos e autorização do portfólio reais.
- Artistas, bios e retratos reais.
- WhatsApp, Instagram, endereço, horários e domínio revisados.
- Textos de atendimento e políticas aprovados pelo responsável.
- Fonte de agenda real ou seleção apresentada somente como preferência.
- Metadados revisados, com URL e informações reais suficientes para gerar canonical, sitemap e dados estruturados.

Depois disso, execute as verificações e o build indicados no `README.md`, confira a versão de produção e siga o procedimento de upload. A publicação externa deve ser realizada pelo responsável pela hospedagem.
