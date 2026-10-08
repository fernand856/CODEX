# Validação da versão beta

As verificações abaixo se referem ao build estático local do projeto, em 7 de outubro de 2026. Ambiente: Node.js 24.19.0, npm 11.9.0 e Chromium headless. Não houve publicação externa nem envio de mensagens para terceiros.

## Resultados confirmados

| Verificação | Resultado | Cobertura |
| --- | --- | --- |
| `npm ci` | Aprovado | Instalação reproduzível usando o lockfile. |
| `npm run typecheck` | Aprovado | TypeScript sem erros. |
| `npm test` | 11 testes aprovados | Fuso de São Paulo, aritmética de datas, disponibilidade determinística por artista, limpeza de datas/períodos incompatíveis, rejeição de datas passadas ou inválidas, validação do pedido e URL de referência, limites de nome/descrição, mensagem e codificação do WhatsApp, integridade dos dados demonstrativos. |
| `npm run build` | Aprovado | Build estático gerado em `dist/`. |
| `npm run test:e2e` | 20 testes aprovados | Chromium headless, contra o build de produção; jornada completa em celular e desktop, teclado, modais, filtros, agenda e cópia da mensagem. Última suíte completa: 49,5 s. |
| Regressão após o último ajuste de nome acessível | 3 testes aprovados | Build final: larguras de 390/1.440 px, assets, overflow, metadados, Axe e ações de estilos/filtros; regra explícita `label-content-name-mismatch`. Capturas regeneradas; execução de 11,5 s. |
| Build e preview em subpasta | Aprovado | `--base=/traco/`: 22 elementos de imagem, 18 arquivos distintos, sem erros JavaScript ou HTTP na conferência. |
| Auditoria de dependências | Sem vulnerabilidades reportadas | Resultado do `npm audit` nesta entrega; não representa uma garantia futura. |
| `git diff --check` | Aprovado | Sem problemas de whitespace nas diferenças verificadas. |

## Interface e acessibilidade

Foram verificados:

- Larguras de 360, 390, 768, 1.024 e 1.440 px, sem transbordamento horizontal e com imagens carregadas.
- Celular de altura reduzida em 390 × 480 px e aproximação de zoom de 200% com CSS `zoom: 2`, incluindo os dois modais.
- Menu, link de pular conteúdo, âncoras e FAQ por teclado; Escape, foco contido e retorno de foco nos modais.
- Filtros combinados, estado vazio, limpeza, expansão de 6 para 12 trabalhos e navegação do lightbox dentro do conjunto filtrado.
- Preferências preenchidas por artista, estilo, referência e explorador de estilos.
- Validação com foco no primeiro erro, preservação ao voltar, edição do resumo, mensagem revisada, cópia real pela área de transferência e alternativa de seleção manual quando a cópia falha.
- Datas indisponíveis, troca de artista e revalidação de uma data que passou durante a sessão na virada do dia em São Paulo.
- Movimento reduzido, ausência de telefone inventado e ausência de dados do pedido em `localStorage` ou `sessionStorage`.

Não foram detectados erros JavaScript ou de console nas jornadas automatizadas. A análise Axe não encontrou violações sérias ou críticas nos estados iniciais de 390/1.440 px, no lightbox e no modal de revisão. Isso não equivale a uma certificação ou auditoria completa de acessibilidade.

Capturas de página completa: [desktop](docs/screenshots/beta-desktop.png) e [celular](docs/screenshots/beta-mobile.png). Primeira tela: [desktop](docs/screenshots/beta-desktop-hero.png) e [celular](docs/screenshots/beta-mobile-hero.png).

## Lighthouse

Medição com Lighthouse 13.5.0 em 7/10/2026, às 19h22 no fuso `America/Sao_Paulo`, contra o preview de produção em `http://127.0.0.1:4173/`. Foi usada emulação móvel de 412 × 823 px, rede simulada e desaceleração de CPU de 4×.

| Categoria | Pontuação |
| --- | --- |
| Desempenho | 95 |
| Acessibilidade | 100 |
| Boas práticas | 100 |
| SEO | 66 |

FCP: 1,4 s; LCP: 2,9 s; TBT: 40 ms; CLS: 0. O único item reprovado de SEO é a ausência de permissão para indexação, esperada neste demo com `noindex` e bloqueio em `robots.txt`. Os checks de validade de `robots.txt` e de correspondência entre rótulo visível e nome acessível passaram.

Relatórios completos: [HTML](docs/lighthouse.report.html) e [JSON](docs/lighthouse.report.json). Estes valores retratam uma medição local; rede, hospedagem e alterações futuras podem mudar o resultado. A pontuação de acessibilidade não substitui a revisão com tecnologias assistivas.

## Correção da prévia cloud — 7/10/2026

Na instância recriada, não havia servidor do projeto em execução. Foi iniciado o preview de produção em `0.0.0.0:3000`, e `vite.config.ts` passou a definir a porta 3000 com `strictPort` para desenvolvimento e preview. O preview dos arquivos públicos de `dist/` aceita o hostname variável do proxy da plataforma; a proteção de hosts do servidor de desenvolvimento foi preservada.

Também foi reproduzida uma página vazia em um proxy local que atende somente sob `/preview/`: os caminhos absolutos do build solicitavam três assets fora desse prefixo, recebiam HTTP 404 e deixavam o conteúdo React vazio. O padrão foi alterado para `base: './'`, mantendo os recursos relativos à URL da página.

Após os ajustes, instalação por lockfile, TypeScript e build passaram novamente. A suíte original de 20 testes e as 3 regressões acima permanecem como histórico da entrega; os resultados da nova execução estão registrados abaixo. O endereço externo depende do encaminhamento da porta 3000, e o processo precisa ser iniciado novamente após recriar a máquina.

As instruções de instalação e inicialização foram salvas em rascunho nas configurações cloud. Elas ainda precisam ser revisadas e publicadas para serem usadas em futuras instâncias. O salvamento não executa comandos nem publica a configuração; o preview da instância atual já foi iniciado.

Resultados da correção:

| Verificação | Resultado |
| --- | --- |
| `npm test` | 11 testes aprovados novamente. |
| Interface no build com caminhos relativos | 20 testes existentes aprovados em 51,6 s. |
| Nova regressão de proxy com prefixo e hostname variável | Aprovada em execução isolada de 2,2 s. |
| Conferência independente em navegador | App direto na porta 3000, iframe de mesma origem e proxy local sob `/preview/traco/` renderizaram a página. |

São 21 verificações de interface aprovadas de forma consolidada: 20 na execução principal e uma regressão específica na execução posterior.

No proxy simulado com hostname `preview.example.test`, HTML, scripts, estilos e fotografias carregaram sob o prefixo, sem HTTP 404 ou erros JavaScript. Foram conferidos hero, filtros Fine line + Nina com três resultados, referência transportada ao pedido, preenchimento completo, revisão e cópia real da mensagem, sem contato fictício. No momento da conferência, o preview estava ativo na porta 3000.

Capturas da correção: [app direto](docs/screenshots/preview-corrigido.png) e [proxy com prefixo](docs/screenshots/preview-proxy-corrigido.png). O wrapper real do painel de prévia da plataforma permaneceu sem verificação, pois estava inacessível às ferramentas. A evidência de iframe corresponde a um iframe local de mesma origem, e o proxy foi simulado.

A medição Lighthouse registrada acima pertence à entrega anterior a esta correção de configuração e não foi repetida para a prévia corrigida.

## HTML portátil — 7/10/2026

Foi acrescentado o comando `npm run export:standalone` para reunir a mesma aplicação em `entrega/traco-beta-abrir.html`, com JavaScript, CSS, favicon e 18 fotografias embutidos. O objetivo é permitir a demonstração com um único arquivo, sem servidor ou instalação de dependências no dispositivo de quem o abre.

A versão final tem 1.080.080 bytes, aproximadamente 1,03 MiB. Após corrigir o exportador, foi validada em navegador com um servidor HTTP que disponibilizava somente esse HTML. A conferência cobriu desktop e celular de 390 px; houve exatamente duas requisições de documento, uma em cada contexto, e nenhuma requisição de recursos externos ou erro JavaScript. Também foi ativado o modo offline após obter o HTML.

Passaram as verificações de ausência de transbordamento, carregamento de 22 elementos de imagem após expandir o portfólio, filtros combinados, estado vazio e limpeza, lightbox com setas/Escape/retorno de foco, preferências transportadas ao formulário, revisão do pedido e alternativa de cópia manual. Uma segunda conferência independente também aprovou o HTML.

Capturas: [desktop portátil](docs/screenshots/portatil-desktop.png) e [celular portátil](docs/screenshots/portatil-mobile.png).

A abertura direta por `file://` não foi executada: o Chromium gerenciado deste ambiente bloqueia esse protocolo. A validação HTTP e offline comprova o carregamento dos recursos embutidos e as interações verificadas; a abertura nativa como arquivo permanece pendente em um navegador comum.

O usuário confirmou o download e o funcionamento da prévia do HTML portátil pela interface. Essa confirmação se refere a `traco-beta-abrir.html`. Os downloads dos ZIPs pela página auxiliar falharam no visualizador real, conforme relato posterior do usuário. A abertura local por `file://` permanece pendente, e o painel real da plataforma não foi inspecionado pelas ferramentas.

## Página para salvar código e build — 7/10/2026

O usuário relatou que os links dos ZIPs exibiam “Prévia de arquivo não suportada”, enquanto a prévia do HTML funcionava. Foi preparada `entrega/baixar-traco-beta.html`, página autônoma com os ZIPs de código e build embutidos e dois controles que criam downloads por Blob após o clique.

O pacote essencial `entrega/traco-codigo-beta.zip` contém fonte completo, configurações, testes, lockfile, fotografias e documentação, com orientação em `LEIA-ME-ENTREGA.txt`. Ele omite capturas de tela e relatórios Lighthouse, presentes na entrega de fonte completa.

O ZIP essencial conserva os quatro documentos do momento em que foi empacotado. As notas atuais sobre a página de salvar estão no repositório e nos documentos entregues separadamente; o pacote não foi refeito durante sua validação.

A página final tem 1.740.192 bytes. Em navegador automatizado, após carregá-la por HTTP e ativar o modo offline, os dois controles geraram downloads por Blob que foram recebidos e salvos:

| Arquivo | Tamanho | Integridade |
| --- | --- | --- |
| `traco-codigo-beta.zip` | 647.402 bytes | Idêntico ao original, por comparação de bytes e SHA-256. |
| `traco-beta-site.zip` | 654.732 bytes | Idêntico ao original, por comparação de bytes e SHA-256. |

Houve uma única requisição HTTP, do documento, sem recursos externos nem erros JavaScript ou HTTP. A página em 390 px manteve documento e conteúdo na largura da tela, sem transbordamento. Esses resultados correspondem ao navegador automatizado de QA.

O usuário confirmou posteriormente que os dois botões **não salvam os arquivos** no visualizador real da plataforma. Portanto, os downloads por Blob foram aprovados somente no navegador de QA e falharam no fluxo real do usuário. A causa no wrapper não foi inspecionada pelas ferramentas.

## Arquivos diretos da entrega

O código-fonte, documentação, fotografias, lockfile, configurações e testes estão no projeto. O build estático está em `dist/`, e o HTML portátil está em `entrega/traco-beta-abrir.html`. Esses arquivos foram preparados para compor a entrega versionada, sem depender dos botões de download.

Os ZIPs e a página auxiliar foram gerados localmente e ficam fora do versionamento desta entrega. A preparação local não implica envio ao GitHub ou outra publicação externa.

## Configuração do GitHub Pages — 7/10/2026

O padrão do Vite passou a ser `/CODEX/` para o destino `https://fernand856.github.io/CODEX/`. O workflow `.github/workflows/pages.yml` instala pelo lockfile, executa testes de lógica e o build com TypeScript e publica somente `dist/` usando as actions oficiais do Pages. PRs compilam e a publicação é restrita à `main`.

Verificações locais desta configuração:

- `npm ci`: instalação concluída pelo lockfile com Node.js 24.19.0.
- `npm test`: 11 testes de lógica aprovados.
- `npm run build -- --outDir /tmp/traco-pages-build --emptyOutDir`: TypeScript e build aprovados com a base padrão `/CODEX/`; o destino isolado preservou a prévia cloud em execução.
- Interface: 21 testes aprovados em 53,7 s no build isolado, incluindo carregamento de scripts, CSS, favicon e 22 elementos de imagem sob `/CODEX/`, filtros, lightbox, pedido, calendário e cópia.
- `actionlint` 1.7.7: workflow aprovado. A ferramenta foi obtida do release oficial com checksum SHA-256 conferido.
- Prévia cloud: `npm run build -- --base=./ --outDir dist-cloud` aprovado; preview temporário serviu HTML, JavaScript, CSS e hero com HTTP 200. O processo temporário foi encerrado, e as instruções cloud foram salvas em rascunho para usar essa saída separada.

A execução do workflow no GitHub e a URL pública dependem da configuração **Settings → Pages → Source: GitHub Actions** e da incorporação do PR à `main`. As verificações locais não comprovam um deployment remoto.

## Limites da entrega

- HTTPS, configuração da Hostinger e funcionamento no domínio final precisam ser conferidos pelo responsável após a publicação.
- O contato real não está configurado. A construção e a codificação da URL do WhatsApp são verificadas por teste de lógica, sem enviar uma solicitação a uma pessoa.
- A disponibilidade permanece fictícia. Não foram integrados reserva automática, servidor, pagamentos, CRM ou envio de e-mail.
- Safari e Firefox, leitores de tela, aparelhos iOS/Android e teclado virtual não foram verificados. O zoom nativo de navegador/OS a 200% permanece pendente; o teste feito usa CSS `zoom: 2`.
- A abertura com um contato real no aplicativo WhatsApp permanece pendente. O beta não possui número real e não foi usado para contatar terceiros.
