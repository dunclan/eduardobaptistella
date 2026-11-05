# Eduardo Baptistella: portfólio

No ar em [eduardobaptistella.vercel.app](https://eduardobaptistella.vercel.app).

Next.js 16, React 19, TypeScript, GSAP, Lenis e um shader WebGL próprio. Direção criativa em [docs/DIRECTION.md](docs/DIRECTION.md).

## Rodar

```bash
npm install
```

```bash
npm run dev
```

## Atualizar

| O que mudar | Onde |
|---|---|
| Email, WhatsApp, LinkedIn | `contacts` em `src/content/site.ts` |
| Textos da interface, projetos, arquivo, competências | `src/content/pt.ts` |
| URL pública do site | variável `NEXT_PUBLIC_SITE_URL` |
| Liberar nos buscadores | `indexable: true` em `src/content/site.ts`, depois `vercel deploy --prod` |

## Adicionar um projeto em destaque

1. Capture o site. Requer Python com `playwright` instalado. O comando gera `_captures/clean/nome/` com `d00.jpg` a `d09.jpg` (desktop) e `m00.jpg` a `m05.jpg` (celular):

   ```bash
   python scripts/recapture.py _captures/clean nome=https://endereco-do-site
   ```

   No Git Bash do Windows, antes do comando, rode `export MSYS_NO_PATHCONV=1 PYTHONIOENCODING=utf-8`.

   Este comando usa movimento reduzido e esconde banners e botões flutuantes. Se a abertura de um site depender de animação e sair incompleta, use `scripts/capture.py`, que grava em `_captures/nome/desktop` e `_captures/nome/mobile`.
2. Olhe os quadros e escolha os melhores. Evite fotos de pessoas e dados pessoais.
3. Acrescente o projeto em `SOURCES` de `scripts/images.mjs`, com as chaves `hero`, `a`, `b`, `c`, `d`, `m1`, `m2`, `m3`.
4. Rode `npm run images`.
5. Acrescente o objeto em `projects`, em `src/content/pt.ts`. O TypeScript aponta qualquer campo faltando. Confira se cada `alt` e `caption` descreve a imagem escolhida.
6. Rode `npm run brand` para gerar a imagem de compartilhamento do projeto em `public/og`.
7. Rode `npm run check`.

`_captures/` fica fora do Git e do deploy. Faça backup dessa pasta se quiser reprocessar as imagens depois.

A página, o palco, o sitemap e a verificação de status são gerados a partir desses dados. A ordem do array é a ordem do site. O corte de canal se ajusta ao novo total, mas o título "Sete trabalhos" em `ui.stage.title` é manual.

## Adicionar ao arquivo

Acrescente um item em `archive`, em `src/content/pt.ts`. Para a prévia, coloque um `<id>.webp` em `public/work/arquivo/`.

## Adicionar inglês

1. Crie `src/content/en.ts` com as mesmas exportações de `pt.ts`.
2. Registre em `content`, em `src/content/index.ts`.
3. Adicione as rotas `/en`.

Os textos da manchete são `LINES` em `src/components/Hero.tsx`, porque cada linha tem corpo próprio em `globals.css`.

## Verificar

```bash
npm run check
```

```bash
npm run build
```

Com `npm run start -- -p 3211` rodando:

```bash
npm run qa
```

O QA cobre rotas, overflow, títulos cortados, erros de console, axe (WCAG AA), movimento reduzido, palco WebGL, rótulo do cursor, transição de página, teclado e links externos.

## Movimento

- Corte de canal: `src/components/Stage.tsx`.
- Manchete com largura variável: `src/components/Hero.tsx`.
- Rolagem suave, transição de página e cabeçalho: `src/components/Motion.tsx`.
- Com `prefers-reduced-motion`, sem WebGL ou no celular, o palco vira uma pilha de telas em CSS, sem JavaScript.
