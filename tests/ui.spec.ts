import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { works } from '../src/data/content';

const selectedWorks = works.filter(work => work.artistId === 'nina' && work.styleId === 'fine-line');

const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use(errors);
    expect(errors, 'A jornada não deve produzir erros JavaScript ou de console').toEqual([]);
  }, { auto: true }],
});

test.use({ timezoneId: 'America/Sao_Paulo' });

async function openSite(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function assertNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    available: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(sizes.document, 'O documento não deve transbordar horizontalmente').toBeLessThanOrEqual(sizes.available + 1);
  expect(sizes.body, 'O conteúdo não deve transbordar horizontalmente').toBeLessThanOrEqual(sizes.available + 1);
}

async function loadEveryImage(page: Page) {
  const images = page.locator('img');
  expect(await images.count(), 'O beta deve conter o portfólio e imagens editoriais locais').toBeGreaterThan(10);
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => {
      const img = element as HTMLImageElement;
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    }), { message: `Imagem ${index + 1} deve carregar sem ícone quebrado` }).toBe(true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

async function assertAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const important = result.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(important.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
  }))).toEqual([]);
}

async function fillIdea(page: Page, description = 'Um ramo botânico leve para acompanhar o antebraço.') {
  const booking = page.locator('#agenda');
  await booking.getByLabel(/^Estilo\s/).selectOption('fine-line');
  await booking.getByLabel(/^Artista\s/).selectOption('nina');
  await booking.getByLabel(/^Região do corpo\s/).selectOption('Antebraço');
  await booking.getByLabel(/^Tamanho aproximado\s/).selectOption('Pequena — até 10 cm');
  await booking.getByLabel(/^Conte sua ideia\s/).fill(description);
}

async function finishDemoRequest(page: Page) {
  await fillIdea(page);
  const booking = page.locator('#agenda');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByRole('radio', { name: /^Combinar pelo WhatsApp/ }).check();
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByLabel(/^Como podemos chamar você\?/).fill('Lia Beta');
  await booking.getByRole('button', { name: 'Visualizar pedido', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Seu pedido, em palavras.' })).toBeVisible();
}

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`produção utilizável em ${width}px, com assets íntegros`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSite(page);
    await assertNoOverflow(page);
    await loadEveryImage(page);
    await assertNoOverflow(page);
    await expect(page.getByText('Projeto demonstrativo — estúdio, artistas e agenda fictícios.', { exact: true })).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
    expect(await page.locator('html').getAttribute('lang')).toBe('pt-BR');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: `docs/screenshots/beta-${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true, animations: 'disabled' });
      await page.screenshot({ path: `docs/screenshots/beta-${width === 1440 ? 'desktop' : 'mobile'}-hero.png`, animations: 'disabled' });
      await assertAccessible(page);
    }
  });
}

test('tela móvel curta e zoom de 200% mantêm o fluxo legível', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await openSite(page);
  await assertNoOverflow(page);
  await page.locator('#inicio').getByRole('button', { name: 'Planejar minha tattoo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vamos tirar sua ideia do papel?', exact: true })).toBeVisible();
  await assertNoOverflow(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await assertNoOverflow(page);
  await expect(page.getByRole('heading', { name: 'Vamos tirar sua ideia do papel?', exact: true })).toBeVisible();
});

test('lightbox e revisão preservam fechamento e leitura na aproximação CSS de zoom200%', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSite(page);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.getByRole('button', { name: /^Ampliar Entre sombras,/ }).click();
  let dialog = page.getByRole('dialog');
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1441);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(901);
  await expect(dialog.getByRole('button', { name: 'Fechar imagem ampliada' })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Fechar imagem ampliada' })).toBeInViewport();
  await page.keyboard.press('Escape');
  await finishDemoRequest(page);
  dialog = page.getByRole('dialog', { name: 'Seu pedido, em palavras.' });
  await expect(dialog.getByRole('button', { name: 'Fechar visualização do pedido', exact: true })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Copiar mensagem', exact: true }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: 'Copiar mensagem', exact: true })).toBeInViewport();
  await assertNoOverflow(page);
});

test('movimento reduzido desativa transições não essenciais', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const motion = await page.evaluate(() => {
    const elements = [document.documentElement, ...document.querySelectorAll('a, button, img, [data-reveal]')];
    const duration = (value: string) => value.split(',').reduce((max, item) => {
      const parsed = parseFloat(item);
      return Math.max(max, item.trim().endsWith('ms') ? parsed : parsed * 1000);
    }, 0);
    return elements.filter(element => {
      const style = getComputedStyle(element);
      return duration(style.animationDuration) > 1 || duration(style.transitionDuration) > 1;
    }).map(element => ({ tag: element.tagName, class: element.className }));
  });
  expect(motion, 'Controles e imagens respeitam a preferência por movimento reduzido').toEqual([]);
});

test('menu móvel funciona por teclado, Escape e âncoras sem esconder o título', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 720 });
  await openSite(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();
  const toggle = page.getByRole('button', { name: 'Abrir menu', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Fechar menu', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const nav = page.getByRole('navigation', { name: 'Navegação principal', exact: true });
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).not.toBeVisible();
  await toggle.click();
  await nav.getByRole('link', { name: 'Trabalhos', exact: true }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#trabalhos$/);
  const title = page.locator('#portfolio-title');
  await expect(title).toBeInViewport();
  await expect.poll(async () => {
    const titleBounds = await title.boundingBox();
    const headerBounds = await page.locator('header').boundingBox();
    return (titleBounds?.y ?? -1) >= (headerBounds ? headerBounds.y + headerBounds.height : 0);
  }, { message: 'O cabeçalho não cobre o título da seção de destino' }).toBe(true);
});

test('perguntas frequentes abrem e fecham com Enter e Espaço', async ({ page }) => {
  await openSite(page);
  const questions = page.locator('#duvidas details');
  await expect(questions).toHaveCount(6);
  for (let index = 0; index < await questions.count(); index += 1) {
    const question = questions.nth(index);
    const summary = question.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(question).toHaveAttribute('open', '');
    await expect(question.locator('p')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(question).not.toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(question.locator('p')).toBeVisible();
  }
});

test('galeria combina filtros, explica ausência de resultados e permite ampliar todos os trabalhos', async ({ page }) => {
  await openSite(page);
  const portfolio = page.locator('#trabalhos');
  const thumbnails = portfolio.getByRole('button', { name: /^Ampliar / });
  await expect(thumbnails).toHaveCount(6);
  await portfolio.getByRole('button', { name: 'Ver mais trabalhos', exact: true }).click();
  await expect(thumbnails).toHaveCount(12);
  expect(new Set(await thumbnails.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src))).size).toBe(12);
  await loadEveryImage(page);
  await expect(portfolio.getByRole('button', { name: 'Ver mais trabalhos', exact: true })).toHaveCount(0);
  await portfolio.getByRole('button', { name: 'Blackwork', exact: true }).click();
  await portfolio.getByLabel('Artista', { exact: true }).selectOption('nina');
  await expect(thumbnails).toHaveCount(0);
  await expect(portfolio.getByRole('status')).toHaveText('0 trabalhos encontrados');
  await expect(portfolio.getByRole('heading', { name: 'Ainda não há uma composição nessa combinação.' })).toBeVisible();
  await portfolio.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  await expect(portfolio.getByLabel('Artista', { exact: true })).toHaveValue('all');
  await expect(portfolio.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(thumbnails).toHaveCount(6);
  await portfolio.getByRole('button', { name: 'Fine line', exact: true }).click();
  await portfolio.getByLabel('Artista', { exact: true }).selectOption('nina');
  await expect(thumbnails).toHaveCount(3);
  await expect(portfolio.getByRole('status')).toHaveText('3 trabalhos encontrados');
  await expect(thumbnails.nth(0)).toHaveAccessibleName(/Jardim particular, Fine line/);
});

test('lightbox navega somente pelos resultados filtrados, contém foco e restaura o acionador', async ({ page }) => {
  await openSite(page);
  const portfolio = page.locator('#trabalhos');
  await portfolio.getByRole('button', { name: 'Fine line', exact: true }).click();
  await portfolio.getByLabel('Artista', { exact: true }).selectOption('nina');
  const trigger = portfolio.getByRole('button', { name: /^Ampliar Jardim particular,/ });
  await trigger.click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName('Jardim particular');
  await expect(dialog.getByRole('button', { name: 'Fechar imagem ampliada', exact: true })).toBeFocused();
  await expect(dialog.getByText('Nina Duarte', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog).toHaveAccessibleName(selectedWorks[1].title);
  await page.keyboard.press('ArrowLeft');
  await expect(dialog).toHaveAccessibleName('Jardim particular');
  await dialog.getByRole('button', { name: 'Trabalho anterior', exact: true }).click();
  await expect(dialog).toHaveAccessibleName(selectedWorks.at(-1)!.title);
  await dialog.getByRole('button', { name: 'Próximo trabalho', exact: true }).click();
  await expect(dialog).toHaveAccessibleName('Jardim particular');
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press(index % 2 === 0 ? 'Tab' : 'Shift+Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement)), 'O foco permanece dentro do modal').toBe(true);
  }
  await assertAccessible(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Fechar imagem ampliada', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('lightbox mantém fechar e leitura disponíveis em celular de pouca altura', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await openSite(page);
  await page.getByRole('button', { name: /^Ampliar Entre sombras,/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Fechar imagem ampliada' })).toBeInViewport();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(481);
  await dialog.getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  await assertNoOverflow(page);
});

test('artistas e faixa de estilos atualizam a galeria com a seleção correspondente', async ({ page }) => {
  await openSite(page);
  const nina = page.getByRole('article', { name: 'Nina Duarte', exact: true });
  await nina.getByRole('button', { name: 'Ver trabalhos', exact: true }).click();
  const portfolio = page.locator('#trabalhos');
  await expect(portfolio.getByLabel('Artista', { exact: true })).toHaveValue('nina');
  await expect(portfolio.getByRole('button', { name: /^Ampliar / })).toHaveCount(3);
  await expect(portfolio.getByRole('status')).toHaveText('3 trabalhos encontrados');
  await page.locator('#estilos').getByRole('button', { name: /Tradicional/ }).click();
  await expect(portfolio.getByRole('button', { name: 'Tradicional', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(portfolio.getByLabel('Artista', { exact: true })).toHaveValue('all');
  await expect(portfolio.getByRole('button', { name: /^Ampliar / })).toHaveCount(3);
  const labels = await new AxeBuilder({ page }).include('#estilos').withRules(['label-content-name-mismatch']).analyze();
  expect(labels.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), 'O nome acessível inclui o texto apresentado no controle').toEqual([]);
});

test('referência ampliada, perfil e explorador preenchem preferências do pedido', async ({ page }) => {
  await openSite(page);
  await page.getByRole('button', { name: /^Ampliar Jardim particular,/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true }).click();
  const booking = page.locator('#agenda');
  await expect(booking.getByLabel(/^Estilo\s/)).toHaveValue('fine-line');
  await expect(booking.getByLabel(/^Artista\s/)).toHaveValue('nina');
  await expect(booking.getByText('Esta referência orienta um projeto próprio, desenvolvido em conversa com o artista.', { exact: true })).toBeVisible();
  await page.getByRole('article', { name: 'Rafael Costa', exact: true }).getByRole('button', { name: 'Solicitar sessão', exact: true }).click();
  await expect(booking.getByLabel(/^Artista\s/)).toHaveValue('rafael');
  await page.getByRole('button', { name: 'Descobrir possibilidades', exact: true }).click();
  await page.getByRole('radio', { name: 'Traços e formas', exact: true }).check();
  await page.getByRole('radio', { name: 'Sutil e delicada', exact: true }).check();
  await expect(page.getByRole('heading', { name: 'Fine line?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Começar com essa ideia', exact: true }).click();
  await expect(booking.getByLabel(/^Estilo\s/)).toHaveValue('fine-line');
});

for (const journeyWidth of [390, 1440]) {
test(`pedido valida, mantém dados e copia a mensagem revisada em ${journeyWidth}px`, async ({ page, context }) => {
  await page.setViewportSize({ width: journeyWidth, height: 900 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openSite(page);
  const booking = page.locator('#agenda');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Estilo\s/)).toBeFocused();
  await expect(booking.getByLabel(/^Estilo\s/)).toHaveAttribute('aria-invalid', 'true');
  await fillIdea(page, '     ramo     ');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Conte sua ideia\s/)).toBeFocused();
  await expect(booking.getByText('Conte sua ideia em 10 a 1.000 caracteres, sem contar os espaços nas extremidades.', { exact: true })).toBeVisible();
  const originalIdea = '  Um ramo botânico leve com folhas pequenas e espaço entre os traços.  ';
  await booking.getByLabel(/^Conte sua ideia\s/).fill(originalIdea);
  await booking.getByLabel(/^Link de referência\s/).fill('ftp://example.com/referencia');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Link de referência\s/)).toBeFocused();
  const referenceUrl = 'https://example.com/referencia?estilo=fine+line#flor';
  await booking.getByLabel(/^Link de referência\s/).fill(referenceUrl);
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByRole('radio', { name: /^Combinar pelo WhatsApp/ })).toBeChecked();
  await assertNoOverflow(page);
  await booking.getByLabel(/^Orçamento em mente\s/).fill('Prefiro conversar');
  await booking.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(booking.getByLabel(/^Conte sua ideia\s/)).toHaveValue(originalIdea);
  await expect(booking.getByLabel(/^Link de referência\s/)).toHaveValue(referenceUrl);
  await expect(booking.getByLabel(/^Estilo\s/)).toHaveValue('fine-line');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Orçamento em mente\s/)).toHaveValue('Prefiro conversar');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByLabel(/^Como podemos chamar você\?/).fill(' A ');
  await assertNoOverflow(page);
  await booking.getByRole('button', { name: 'Visualizar pedido', exact: true }).click();
  await expect(booking.getByLabel(/^Como podemos chamar você\?/)).toBeFocused();
  await expect(booking.getByLabel(/^Como podemos chamar você\?/)).toHaveAttribute('aria-invalid', 'true');
  await booking.getByLabel(/^Como podemos chamar você\?/).fill(' Lia Beta ');
  await booking.getByRole('button', { name: 'Editar sua ideia', exact: true }).click();
  await expect(booking.getByLabel(/^Conte sua ideia\s/)).toBeFocused();
  const revisedIdea = 'Um ramo de folhas finas, com espaço entre os traços e composição vertical.';
  await booking.getByLabel(/^Conte sua ideia\s/).fill(`  ${revisedIdea}  `);
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Como podemos chamar você\?/)).toHaveValue(' Lia Beta ');
  await expect(booking.getByText(revisedIdea, { exact: true })).toBeVisible();
  await expect(booking.getByText('Demonstração: contato do estúdio ainda não configurado.', { exact: true })).toBeVisible();
  await expect(booking.getByRole('button', { name: 'Continuar no WhatsApp', exact: true })).toHaveCount(0);
  await booking.getByRole('button', { name: 'Visualizar pedido', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Seu pedido, em palavras.' });
  await expect(preview).toBeVisible();
  await assertNoOverflow(page);
  const expectedMessage = [
    'Olá! Meu nome é Lia Beta e gostaria de conversar sobre uma tatuagem.',
    '',
    'Estilo: Fine line',
    'Artista: Nina Duarte',
    'Região do corpo: Antebraço',
    'Tamanho aproximado: Pequena — até 10 cm',
    `Ideia: ${revisedIdea}`,
    `Referência: ${referenceUrl}`,
    'Data/período de preferência: Combinar pelo WhatsApp',
    'Orçamento: Prefiro conversar',
    '',
    'Gostaria de confirmar a viabilidade, o orçamento e a disponibilidade.',
  ].join('\n');
  await expect(preview.getByLabel('Mensagem do pedido', { exact: true })).toHaveValue(expectedMessage);
  await preview.getByRole('button', { name: 'Copiar mensagem', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('Mensagem copiada. Você pode colá-la em uma conversa.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expectedMessage);
  await assertAccessible(page);
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.keyboard.press('Escape');
  await expect(preview).not.toBeVisible();
  await expect(booking.getByRole('button', { name: 'Visualizar pedido', exact: true })).toBeFocused();
});
}

test('falha da área de transferência oferece texto selecionado para cópia manual', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new DOMException('Permissão negada durante teste do fallback', 'NotAllowedError'); },
    } });
  });
  await openSite(page);
  await finishDemoRequest(page);
  const preview = page.getByRole('dialog', { name: 'Seu pedido, em palavras.' });
  await preview.getByRole('button', { name: 'Copiar mensagem', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('Cópia automática indisponível. O texto está selecionado: use Copiar no dispositivo ou Ctrl/Cmd + C.');
  const message = preview.getByLabel('Mensagem do pedido', { exact: true });
  await expect(message).toBeFocused();
  const selection = await message.evaluate(element => {
    const textarea = element as HTMLTextAreaElement;
    return { start: textarea.selectionStart, end: textarea.selectionEnd, length: textarea.value.length };
  });
  expect(selection.start).toBe(0);
  expect(selection.end).toBe(selection.length);
});

test('agenda recusa dias indisponíveis, exige período e limpa preferência incompatível ao mudar artista', async ({ page }) => {
  await openSite(page);
  await fillIdea(page);
  const booking = page.locator('#agenda');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByRole('radio', { name: /^Escolher uma preferência de data/ }).check();
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Data demonstrativa\s/)).toBeFocused();
  const dateSelect = booking.getByLabel(/^Data demonstrativa\s/);
  const dates = await dateSelect.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value).filter(Boolean));
  expect(dates.length).toBeGreaterThan(0);
  // Nina and Caio have different weekday patterns; the first Nina date cannot
  // remain available after selecting Caio. Calendar values stay YYYY-MM-DD.
  const selectedDate = dates[0];
  await dateSelect.selectOption(selectedDate);
  const period = booking.getByRole('combobox', { name: /^Período\s/ });
  const availablePeriods = await period.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value).filter(Boolean));
  expect(availablePeriods.length).toBeGreaterThan(0);
  await period.selectOption(availablePeriods[0]);
  for (let attempts = 0; attempts < 2 && await booking.getByRole('button', { name: /selecionado como preferência/ }).count() === 0; attempts += 1) {
    await booking.getByRole('button', { name: 'Ver próximo mês', exact: true }).click();
  }
  await expect(booking.getByRole('button', { name: /selecionado como preferência/ })).toHaveAttribute('aria-pressed', 'true');
  await booking.getByLabel('Ver agenda do artista', { exact: true }).selectOption('caio');
  await expect(dateSelect).toHaveValue('');
  await expect(period).toHaveValue('');
  await expect(period).toBeDisabled();
  await expect(booking.getByText('A data anterior não está disponível para este artista. Escolha outra preferência ou combine pelo WhatsApp.', { exact: true })).toBeVisible();
  await expect(booking.getByRole('button', { name: /selecionado como preferência/ })).toHaveCount(0);
  const unavailable = booking.getByRole('button', { name: /: indisponível$/ });
  expect(await unavailable.count()).toBeGreaterThan(0);
  for (let index = 0; index < await unavailable.count(); index += 1) await expect(unavailable.nth(index)).toBeDisabled();
  await booking.getByRole('radio', { name: /^Combinar pelo WhatsApp/ }).check();
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(booking.getByLabel(/^Como podemos chamar você\?/)).toBeVisible();
  await expect(booking.getByText('Combinar pelo WhatsApp', { exact: true })).toBeVisible();
});

test('pedido aberto à meia-noite de São Paulo não mantém uma data que passou', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-07T23:59:30-03:00'));
  await openSite(page);
  await fillIdea(page);
  const booking = page.locator('#agenda');
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByRole('radio', { name: /^Escolher uma preferência de data/ }).check();
  const date = booking.getByLabel(/^Data demonstrativa\s/);
  await date.selectOption('2026-10-07');
  const period = booking.getByRole('combobox', { name: /^Período\s/ });
  const availablePeriods = await period.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value).filter(Boolean));
  await period.selectOption(availablePeriods[0]);
  await booking.getByRole('button', { name: 'Continuar', exact: true }).click();
  await booking.getByLabel(/^Como podemos chamar você\?/).fill('Lia Beta');
  await page.clock.setFixedTime(new Date('2026-10-08T00:00:30-03:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(booking.getByRole('button', { name: /selecionado como preferência/ })).toHaveCount(0);
  await booking.getByRole('button', { name: 'Visualizar pedido', exact: true }).click();
  await expect(date).toBeVisible();
  await expect(date).toHaveValue('');
  await expect(date).toBeFocused();
  await expect(period).toHaveValue('');
  await expect(period).toBeDisabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const obsoleteDay = booking.getByRole('button', { name: '07 de outubro de 2026: indisponível', exact: true });
  await expect(obsoleteDay).toBeDisabled();
});
