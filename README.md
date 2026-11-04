# Advento Tour · Excursão 2026

1. Extraia o ZIP e envie seu conteúdo para a raiz da branch main de um repositório do GitHub. Inclua o arquivo .nojekyll e mantenha as pastas advento e van.
2. No GitHub, entre em Settings → Pages. Selecione Deploy from a branch, main e / (root).
3. Para a prévia de compartilhamento, abra index.html e substitua https://SEU-USUARIO.github.io/SEU-REPOSITORIO/ pelo endereço publicado, incluindo a barra final. Faça commit. Abra capa-compartilhamento.jpg nesse endereço para conferir que a imagem está acessível publicamente.
4. Compartilhe o link HTTPS do site. No Android, abra no Chrome e procure Instalar app ou Adicionar à tela inicial. No iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de Início.

O WhatsApp pode guardar uma prévia em cache. O app é instalado pelo navegador.

Compartilhe a URL da raiz do GitHub Pages. Ela abre a tela de instalação. O ícone instalado abre diretamente aplicativo.html. Configure og:image em index.html e, se for compartilhar aplicativo.html diretamente, também nessa página.

## Ativar o painel administrativo

1. No Cloudflare, instale Wrangler 4.36 ou posterior e autentique com `npx wrangler login`.
2. Dentro de backend, execute `npx wrangler d1 create advento-painel` e coloque o ID retornado no wrangler.toml.
3. Execute `npx wrangler d1 execute advento-painel --remote --file schema.sql` e `npx wrangler deploy`.
4. Execute `npx wrangler secret put ADMIN_PIN` e digite seu código quando solicitado. Use um código mais longo antes de divulgar o site. Nunca coloque o código nos arquivos do GitHub.
5. Execute `npx wrangler secret put SITE_ORIGIN` e informe a origem do GitHub Pages (por exemplo https://seuusuario.github.io, sem o caminho do repositório).
6. Abra painel.js e preencha endpoint com a URL HTTPS do Worker, sem barra final. Publique os arquivos do site no GitHub Pages, excluindo a pasta backend.
7. Abra a página da excursão, toque em 2026 no rodapé, digite o código e confirme pelo teclado. Edite e toque em Salvar alterações. Em outro navegador, recarregue a página para conferir.

As fotos são redimensionadas e o conjunto das alterações tem limite de 1,45 MB. O app público consulta os dados ao abrir a página. A disponibilidade inicial é de 19 lugares livres. A autenticação ocorre no servidor, com limite de tentativas por IP.
