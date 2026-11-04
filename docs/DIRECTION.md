# Direção criativa: NO AR

## Conceito

A prova deste portfólio é simples: os trabalhos estão publicados. A identidade vem da linguagem de transmissão, onde "no ar" significa ao vivo. A manchete é "Tudo aqui está no ar." e o site a demonstra: uma verificação real responde o status HTTP de cada projeto. Sem depoimento e sem métrica inventada.

## Referências estudadas

| Referência | Lição usada | O que não copiei |
|---|---|---|
| Obys (obys.agency) | Índice numerado como navegação; cada projeto vira estudo de caso | Coluna vertical de imagens |
| Lusion (lusion.co) | Escopo aparece antes do clique; WebGL como peça central | Cena 3D abstrata |
| Locomotive (locomotive.ca) | Tipografia que divide a página em linhas de registro; caráter editorial | Imagens dentro de títulos |
| Dennis Snellenberg (dennissnellenberg.com) | Abertura de uma ideia só, com nome e função claros | Letreiro gigante com o nome e foto central |
| Awwwards, categorias de portfólio | Vocabulário de busca: transições, tipografia, scrolling | Nenhum layout |

Limite: as referências foram vistas em texto e em quadros estáticos. Não vi movimento ao vivo.

## Sistema visual

- **Cor.** Tinta `#0F0E0C`, osso `#E9E3D6`, cinza quente `#A39C8D`, sinal `#E9502A`. Uma única cor de acento: a luz de "no ar". Cada estudo de caso assume o tom real da marca do cliente.
- **Tipografia.** Archivo variável para a manchete e o corpo, usando o eixo de largura como expressão. Newsreader itálico para a voz editorial. Martian Mono condensada para dados.
- **Grid.** 12 colunas com margem fluida. Quebras intencionais: títulos cruzam colunas, imagens desalinham.
- **Textura.** Linhas de registro de 1px e grão muito leve em pseudo-elemento fixo.

## Movimento

- **Corte de canal.** Rasgo horizontal em WebGL entre os projetos, sincronizado com o scroll. Sem WebGL ou com movimento reduzido, vira uma lista estática completa.
- **Manchete.** A largura das letras responde à proximidade do cursor. Só em ponteiro fino e sem movimento reduzido.
- **Página.** Placa opaca por transform entre rotas.
- **Revelações.** Títulos por máscara, com um único easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Cursor.** O nativo fica. Há só um rótulo contextual e prévia de imagem no índice.

## Mobile

Não é o desktop encolhido. O palco vira pilha de telas `sticky` com a captura real do celular de cada projeto, sem JavaScript. Cursor, largura variável e WebGL saem. O tamanho do texto segue a tela.

## Decisões de engenharia

- Next.js 16 + React 19 + TypeScript + GSAP + Lenis: a mesma base já publicada no INSUNIA.
- Sem Tailwind, Motion e Three.js: CSS à mão serve melhor um layout editorial, GSAP já cobre o movimento, e o shader cabe em WebGL puro.
- Conteúdo só em `src/content/`, com português como único idioma por enquanto e estrutura pronta para `en`.
