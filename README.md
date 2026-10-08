# Agendamento funcional do Lucas

A evolução da agenda está documentada em [AGENDAMENTO.md](AGENDAMENTO.md). A reserva funcional exige Node.js 24 e SQLite persistente; o GitHub Pages permanece uma demonstração estática e não confirma reservas.

# TRAÇO Tattoo Studio

Beta de uma landing page em português brasileiro para um estúdio fictício de tatuagem. O projeto usa React, TypeScript e Vite e gera arquivos estáticos, sem servidor de aplicação na hospedagem.

A jornada conecta portfólio filtrável, artistas, exploração de estilos, agenda demonstrativa e pedido em três etapas. Sem um WhatsApp real configurado, o visitante pode revisar e copiar a mensagem. As datas são preferências; nenhuma sessão é reservada e nenhuma mensagem é enviada automaticamente.

## HTML portátil

O arquivo `entrega/traco-beta-abrir.html` reúne a mesma aplicação, com JavaScript, CSS, favicon e as 18 fotografias embutidos. Ele foi preparado para demonstrar o beta com um único arquivo, sem instalar Node.js ou iniciar um servidor.

Depois de obter o arquivo no seu dispositivo, abra-o com um navegador. O usuário confirmou o download e o funcionamento da prévia do HTML. Ele foi conferido servindo somente esse arquivo por HTTP, incluindo uso offline após o carregamento. A abertura direta por `file://` ainda precisa ser conferida em um navegador comum: o Chromium gerenciado deste ambiente bloqueia esse protocolo. O painel real da plataforma não foi inspecionado pelas ferramentas. Consulte `VALIDACAO.md` para o escopo efetivamente verificado.

Na pasta do projeto, com as dependências instaladas, gere novamente o HTML após personalizar o conteúdo:

```bash
npm run export:standalone
```

O comando gera o build e recria `entrega/traco-beta-abrir.html`. A versão portátil mantém os avisos e as limitações do demo; a cópia manual da mensagem permanece disponível quando o navegador não autoriza a área de transferência.

Para publicar na Hostinger, siga o procedimento de envio do build estático descrito abaixo.

## Código e build disponíveis

Os arquivos principais estão diretamente no projeto:

- Código-fonte em `src/`, com assets em `public/`, configurações, testes e lockfile na raiz.
- Build estático completo em `dist/`, com `index.html` e os recursos de publicação.
- HTML portátil em `entrega/traco-beta-abrir.html`.

Esses arquivos compõem a entrega preparada para versionamento. Os ZIPs e a página auxiliar de salvar arquivos foram gerados localmente e ficam fora desse versionamento. Os downloads por Blob da página `baixar-traco-beta.html` funcionaram no navegador de QA; o usuário confirmou que seus botões não salvam arquivos no visualizador real da plataforma.

## Abrir localmente

Use Node.js 20.19 ou superior na série 20, ou Node.js 22.12 ou superior, e npm. Execute os comandos na pasta deste projeto, no checkout existente; não é necessário criar um worktree.

A entrega foi verificada com Node.js 24.19.0 e npm 11.9.0.

Neste ambiente, o projeto está em `/workspace/CODEX`. Em outra máquina, use a pasta da sua cópia do projeto.

```bash
cd /workspace/CODEX
npm ci
npm run dev
```

Em uma máquina local, abra `http://localhost:3000/CODEX/`. No ambiente cloud, abra a URL real fornecida pelo encaminhamento da porta 3000 ou pela prévia da plataforma e use os comandos com base relativa abaixo. O endereço `localhost` exibido no terminal pertence à máquina em que o servidor está executando; não é a URL externa para acessar a máquina remota.

## Manter a prévia web funcionando

Para conferir o build estático neste ambiente:

```bash
cd /workspace/CODEX
npm run build -- --base=./ --outDir dist-cloud
npm run preview -- --base=./ --outDir dist-cloud
```

O preview escuta em `0.0.0.0:3000` e serve a pasta local ignorada `dist-cloud/`. Essa saída separada permite gerar `dist/` para o Pages e executar seus testes sem trocar os arquivos usados pela prévia cloud. Mantenha o processo em execução e abra a prévia encaminhada para essa porta. Esse comando serve para inspeção e não publica o projeto em uma hospedagem externa.

Depois de recriar ou reiniciar a máquina cloud, execute `npm run preview -- --base=./ --outDir dist-cloud` novamente. Se as dependências ou o build não estiverem disponíveis, execute primeiro `npm ci` e `npm run build -- --base=./ --outDir dist-cloud`. Para desenvolvimento na prévia cloud, use `npm run dev -- --base=./`. Os arquivos do projeto não mantêm um servidor em execução por si mesmos. Os servidores de desenvolvimento e preview usam a mesma porta 3000: encerre um com `Ctrl+C` antes de iniciar o outro.

As instruções reutilizáveis de instalação e inicialização foram salvas em rascunho nas configurações do ambiente cloud. Para aplicá-las a futuras instâncias, o responsável precisa revisar e publicar essa configuração. Salvar o rascunho não executa os comandos nem publica o ambiente; a prévia atual já está em execução.

## Verificar e gerar os arquivos estáticos

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run preview
```

O build é gerado em `dist/`, com base `/CODEX/`. Os testes de interface usam esse build e iniciam seu próprio preview em `http://127.0.0.1:4173/CODEX/`, definido em `playwright.config.ts`. Se Chromium não estiver disponível, instale o navegador de teste com `npx playwright install chromium`; dependências do sistema podem exigir instalação pelo administrador do ambiente. O último comando permite conferir o resultado localmente em `http://localhost:3000/CODEX/`; ele não publica o site. Consulte `VALIDACAO.md` para os resultados obtidos nesta entrega e as verificações que ainda dependem de outro ambiente.

## Onde editar

| Local | Conteúdo |
| --- | --- |
| `src/data/studio.ts` | Configuração do estúdio, modo de demonstração e contatos |
| `src/data/content.ts` | Artistas, estilos, trabalhos e perguntas frequentes |
| `src/lib/dates.ts` | Disponibilidade demonstrativa, datas e fuso horário |
| `src/lib/request.ts` | Validação do pedido e construção da mensagem |
| `src/lib/assets.ts` | Caminhos dos assets, compatíveis com o caminho base do build |
| `src/components/` | Seções e interações da página |
| `src/styles.css` | Tipografia, espaçamento e layout geral |
| `public/images/` | Assets locais de imagem |
| `dist/` | Resultado estático do build |

`PERSONALIZACAO.md` orienta as alterações e a transição para um cliente real. `ASSETS.md` registra origem, finalidade e condições de uso das imagens. Dados do pedido permanecem no estado da página: atualizar ou fechar a página descarta o preenchimento, sem guardar nome, ideia ou referência em armazenamento persistente.

Arquivos de apoio gerados localmente em `entrega/`, mantidos fora do versionamento desta entrega:

- `traco-tattoo-beta.zip`: pacote único com `ABRIR-SITE.html` na raiz, instruções em `README-ABRIR.txt`, código e documentação em `codigo/` e build estático normal em `build/`.
- `baixar-traco-beta.html`: página autônoma com código e build embutidos; seus controles falham no visualizador real segundo o usuário.
- `traco-codigo-beta.zip`: código completo com assets e documentação essencial, sem capturas e relatórios Lighthouse; inclui `LEIA-ME-ENTREGA.txt`.
- `traco-beta-site.zip`: conteúdo do build estático, com `index.html` na raiz do ZIP, pronto para extrair na pasta pública da hospedagem compatível.
- `traco-beta-fonte.zip`: código-fonte, lockfile, documentação e assets. Não inclui `node_modules`, `.git`, `.env` ou `dist`; instale as dependências e gere o build pelos comandos acima.

Os ZIPs retratam o momento em que foram gerados e podem conter documentação anterior às notas atuais. Arquivos ZIP são pacotes comprimidos para extrair; a interface exibiu “Prévia de arquivo não suportada” para eles. Para trabalhar com a entrega, use diretamente o código, o build e o HTML portátil. Depois de personalizar o projeto, gere um novo build e substitua os arquivos publicados pelo novo resultado.

## Publicar no GitHub Pages

O destino deste projeto é `https://fernand856.github.io/CODEX/`. O padrão em `vite.config.ts` é `base: '/CODEX/'`: scripts, CSS, favicon e imagens usam esse prefixo, incluindo os caminhos gerados pelo helper `asset()`.

1. No repositório GitHub, abra **Settings → Pages → Build and deployment** e selecione **GitHub Actions** como Source.
2. Incorpore o PR de configuração à `main`. O workflow `.github/workflows/pages.yml` executa `npm ci`, `npm test` e `npm run build` com Node.js 24, envia somente `dist/` como artefato e publica pelo mecanismo oficial do Pages.
3. Acompanhe **Actions → Deploy GitHub Pages**. O job `deploy` fornece a URL publicada no ambiente `github-pages`.

PRs direcionados à `main` executam instalação, testes e build, sem publicar. A publicação ocorre em pushes na `main` e também pode ser iniciada em **Actions → Deploy GitHub Pages → Run workflow**, selecionando `main`.

O build é reconstruído pelo workflow a partir do código; o `dist/` versionado da entrega beta não é usado como artefato sem recompilação. O site mantém os avisos demonstrativos e `noindex`.

Para conferir o destino localmente, execute `npm run build` e `npm run preview`, depois abra `http://localhost:3000/CODEX/`. Use os comandos com `--base=./` na prévia cloud ou quando a hospedagem precisar de caminhos relativos.

## Preparar a publicação na Hostinger

Use um produto/plano que permita hospedar arquivos estáticos próprios. O editor visual da Hostinger não é um caminho de importação garantido para este projeto. Não é preciso contratar um plano, comprar domínio ou acessar uma conta de hospedagem para utilizar o beta local.

1. Personalize o conteúdo e gere novamente o build com `npm run build -- --base=./` para usar caminhos relativos.
2. Confira o resultado com `npm run preview -- --base=./`, inclusive menu, imagens, filtros e pedido.
3. Antes de substituir um site existente, faça uma cópia e identifique os arquivos que precisam ser preservados.
4. Pelo gerenciador de arquivos ou outro método do plano, envie **o conteúdo de `dist/`** para a pasta pública, normalmente `public_html`. O arquivo `index.html` deve ficar diretamente nessa pasta; não envie a pasta `dist` como uma camada adicional.
5. Não envie `node_modules`, arquivos `.env`, código-fonte ou o servidor de desenvolvimento como se fossem o site publicado.
6. Depois da publicação feita pelo responsável, confira HTTPS, carregamento de assets, âncoras e fluxo de pedido no domínio final.

O build padrão usa `/CODEX/` para o GitHub Pages. A opção `--base=./` gera caminhos relativos de HTML, scripts, estilos e imagens para outra hospedagem na raiz ou em uma subpasta. Coloque `index.html` diretamente na pasta pública escolhida.

Se a hospedagem exigir um caminho base absoluto conhecido, você pode substituí-lo explicitamente no build, por exemplo:

```bash
npm run build -- --base=/traco/
```

Nesse caso, envie o conteúdo de `dist/` para a subpasta correspondente e confira as imagens e os demais recursos. O helper de assets acompanha o caminho base do Vite. Para um domínio real, `siteUrl` deve corresponder à URL final, incluindo a subpasta quando houver. Use novamente `npm run build` para retornar ao padrão `/CODEX/` do GitHub Pages.

## Antes de usar com um cliente real

Substitua nome e identidade, portfólio autorizado, perfis dos artistas, contatos, endereço, horários, domínio e textos de atendimento. Após a revisão com o responsável, configure `demoMode: false` e `productionContentApproved: true`. Enquanto o modo demo estiver ativo ou o conteúdo real não estiver aprovado, o build mantém `noindex`. Esse metadado orienta buscadores; ele não torna a página privada.

A agenda continuará fictícia até que sua fonte seja substituída. Sem disponibilidade mantida pelo estúdio, prefira um campo de preferência de data a apresentar horários como livres. Uma futura reserva automática requer persistência, controle de concorrência, confirmação no servidor e regras de atendimento; isso está fora do beta.

O build aplica título e descrição a partir da configuração. Canonical, sitemap e dados estruturados só são gerados com os dois campos de modo/aprovação adequados, URL HTTPS válida, endereço preenchido e WhatsApp internacional válido. Veja os critérios completos em `PERSONALIZACAO.md`.

Referências: [publicação estática com Vite](https://vite.dev/guide/static-deploy.html), [gerenciador de arquivos da Hostinger](https://www.hostinger.com/support/4548688-basic-actions-in-the-file-manager-in-hostinger/) e [upload na Hostinger](https://www.hostinger.com/support/1869114-how-to-upload-backups-with-file-manager-in-hostinger/).
