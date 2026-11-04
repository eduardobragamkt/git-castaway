# Git Castaway

Um arquipélago vivo em pixel art, movido pela atividade pública do GitHub. Cada fork vira uma ilha, e cada náufrago vive de acordo com os pushes do seu dono.

**Jogue:** https://eduardobragamkt.github.io/git-castaway/

Personagem, arte e código são originais. O projeto é uma homenagem ao gênero de "ilhas de área de trabalho" dos anos 90, sem usar assets de nenhum outro jogo ou protetor de tela.

## Como jogar

| Ação no GitHub | O que acontece no jogo |
| --- | --- |
| Pushes públicos nos últimos 3 dias | 0: dorme ou fica triste. 1 a 4: pesca. 5 ou mais: trabalha animado. |
| Dar uma estrela | Cai uma caixa de suprimentos, e a ilha ganha melhorias: 1, 3, 5, 10, 25, 50 e 100 estrelas. |
| [Mandar uma garrafa](https://github.com/eduardobragamkt/git-castaway/issues/new?template=garrafa.yml) | O náufrago recolhe a garrafa na praia e lê a mensagem escolhida. |
| [Dar um fork](https://github.com/eduardobragamkt/git-castaway/fork) | Nasce uma nova ilha no arquipélago. |

## Sua própria ilha

1. Dê um fork neste repositório.
2. No seu fork, abra **Settings > Pages** e publique a branch `main`, na pasta raiz.
3. Abra `https://SEU-USUARIO.github.io/git-castaway/`.

Sua página abre no **Modo Solo** e lê os dados publicados pelo repositório central, sem precisar de Actions ou token. Uma ilha nova aparece depois da próxima sincronização, que normalmente roda logo após o fork.

## Por que as garrafas têm mensagens fixas

Qualquer pessoa com conta no GitHub pode abrir uma Issue, e o jogo é uma página pública. Por isso, só aparecem mensagens do catálogo em [`data/garrafas.json`](data/garrafas.json). O título e qualquer outro texto digitado nunca são copiados para os dados do jogo. Uma Issue fora do formato vira a garrafa de "tinta borrada".

Para mudar as mensagens, edite o catálogo e rode `npm run build:form`.

## Desenvolvimento

Requer Node.js 20 ou superior. O projeto não tem dependências.

```bash
npm test
```

```bash
npm run dev
```

Em `http://localhost:4173`, adicione `?dados=test/fixtures/demo.json` para ver um arquipélago de exemplo ou `?ilha=login` para testar o Modo Solo.

```text
data/arquipelago.json        estado do jogo, gerado pelo workflow
data/garrafas.json           catálogo de mensagens pré-aprovadas
scripts/update-data.js       coleta os dados na API do GitHub
.github/workflows/           sincronização por cron e por eventos
js/                          motor em Canvas: ilhas, náufrago, câmera e arte
```

## Limites conhecidos

- A atividade conta apenas eventos públicos. Pushes em repositórios privados não aparecem.
- O arquipélago mostra até 1000 forks. A atividade é atualizada em lotes de 200 por execução, então uma rodada completa pode levar pouco mais de um dia.
- O GitHub Pages pode levar alguns minutos para publicar cada atualização.
