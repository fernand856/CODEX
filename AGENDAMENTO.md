# Agenda funcional — Lucas / Blackwork

## Comportamento

A seção `#agenda` consulta `/api/availability` e confirma via `POST /api/bookings`. O exemplo inicial é 15/10/2026 às 14h, Brasília. Esse horário só aparece como disponível se estiver livre no banco e a data estiver dentro do horizonte permitido. Nenhuma reserva é criada ao carregar a página.

O servidor usa SQLite em disco. Uma transação `BEGIN IMMEDIATE` consulta conflitos e grava a reserva, impedindo dupla ocupação inclusive entre processos que compartilham o mesmo arquivo SQLite. Repetições do mesmo pedido usam uma chave de idempotência e retornam o mesmo protocolo. A confirmação é exibida somente depois do commit. Nenhum telefone ou nome é retornado pela consulta pública.

Regras iniciais em `server/booking.mjs`: Lucas, Blackwork, terça a sábado, início às 10h/12h/14h/16h, blocos de 120 minutos, horizonte de 60 dias. Configure essas regras com o responsável antes de atender clientes reais. A data civil é determinada em `America/Sao_Paulo`; o cálculo dos intervalos usa UTC-03, compatível com o horizonte atual. O estúdio e o portfólio continuam ilustrativos. O identificador legado `caio` permanece no portfólio por compatibilidade; seu nome exibido agora é Lucas, e a API usa `lucas`.

O formulário anterior permanece em `#pedido` para preferências de outros estilos e artistas. Ele não confirma reservas.

## Rodar

Requer Node.js 24 ou superior.

```bash
npm ci
npm run test:booking
npm test
npm run build:server
npm start
```

Abra `http://127.0.0.1:3001`. Para desenvolvimento, execute `npm start` e, em outro terminal, `npm run dev`; o Vite encaminha `/api` ao servidor.

## Publicar

O GitHub Pages e o HTML standalone não executam o servidor. Neles, a consulta deve apresentar indisponibilidade de conexão, sem confirmação falsa. Esta entrega não foi publicada em uma hospedagem com backend.

Na Hostinger, use um produto que permita processo Node.js 24 permanente e armazenamento persistente, por exemplo um VPS configurado para isso. O build de produção com servidor é `npm run build:server` (base `/`); `npm run build` continua destinado ao Pages (`/CODEX/`). Envie `server`, `dist` e `package.json` ao servidor. Execute `npm start` como serviço e use proxy reverso HTTPS no mesmo domínio para página e API. O processo escuta em `127.0.0.1:3001` por padrão.

Configure:

- `PUBLIC_ORIGIN=https://seu-dominio`: origem pública exata; necessária atrás de proxy HTTPS para validação de origem.
- `BOOKING_DB=/caminho-privado-persistente/bookings.sqlite`: fora de `dist` e fora da raiz pública.
- `PORT` e `HOST`, se necessário.

Mantenha backups consistentes do SQLite (incluindo cuidado com WAL; prefira a ferramenta de backup do SQLite), permissões restritas e uma única base compartilhada. Em hospedagem com múltiplas máquinas, migre para um banco central com garantias transacionais. Nenhuma credencial é necessária para rodar localmente.

## Limites

Confirmação somente na tela com protocolo; e-mail, WhatsApp, pagamentos, aprovação do artista, painel administrativo e cancelamento não fazem parte desta entrega. A agenda só conhece reservas desta aplicação: compromissos externos precisam de integração ou gerenciamento antes de uso comercial. Há limitação básica por IP; configure proteção no proxy para um site público. Defina a política de privacidade, acesso administrativo e retenção antes de coletar dados de clientes reais.

## Verificação

`npm run test:booking` testa HTTP real com banco temporário: consulta, duas solicitações simultâneas (uma confirmada e uma recusada), idempotência, datas/horários/contato inválidos, origem externa recusada e persistência após reiniciar. O banco de teste é removido ao terminar; nenhum exemplo é gravado na agenda de produção.
