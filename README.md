# Git Castaway

Um arquipélago vivo em pixel art, movido pela atividade pública do GitHub. Cada fork vira uma ilha, e cada náufrago vive de acordo com os commits públicos do seu dono.

**Jogue:** https://eduardobragamkt.github.io/git-castaway/

Personagem, arte e código são originais. O projeto é uma homenagem ao gênero de "ilhas de área de trabalho" dos anos 90, sem usar assets de nenhum outro jogo ou protetor de tela.

## Como jogar

| Ação no GitHub | O que acontece no jogo |
| --- | --- |
| Commits públicos nos últimos 3 dias | 0: dorme ou fica triste. 1 a 4: pesca com calma. 5 ou mais: trabalha a todo vapor. |
| Dar uma estrela | Cai uma caixa de suprimentos, e a ilha ganha melhorias: 1, 3, 5, 10, 25 e 100 estrelas. |
| [Mandar uma garrafa](https://github.com/eduardobragamkt/git-castaway/issues/new?template=garrafa.yml) | A garrafa fica na praia por 30 minutos. O náufrago lê a mensagem escolhida e só lê de novo depois de 5 minutos. |
| [Dar um fork](https://github.com/eduardobragamkt/git-castaway/fork) | Nasce uma nova ilha no arquipélago. |

## Como explorar

- **Mapa do arquipélago:** arraste para navegar e clique em uma ilha para entrar na cena dela.
- **Cena da ilha:** um quadro de tela cheia que segue o horário local do visitante, do amanhecer à noite.
- **Personagem:** clique no náufrago para ver energia, estrelas, próxima melhoria e o perfil público do dono da ilha no GitHub.
- **Zoom:** use o menu da tela, a roda do mouse, o gesto de pinça ou as teclas `+`, `-` e `0`.

Sem mexer no mouse por alguns segundos, os painéis somem e sobra só a ilha.

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

Parâmetros de teste em `http://localhost:4173`:

| Parâmetro | Efeito |
| --- | --- |
| `?dados=test/fixtures/demo.json` | Carrega um arquipélago de exemplo |
| `?ilha=login` | Abre o Modo Solo daquele usuário |
| `?visao=cena` ou `?visao=mapa` | Força a visão inicial |
| `?hora=21` | Fixa o horário do céu e da luz |
| `?cena=coconut` | Repete uma atividade do náufrago (veja `js/scene/activities.js`) |
| `?cena=coconut&variante=stone` | Repete uma versão específica da atividade |

Os parâmetros `dados`, `visao`, `hora`, `cena` e `variante` só funcionam em ambiente local.

```text
data/arquipelago.json        estado do jogo, gerado pelo workflow
data/garrafas.json           catálogo de mensagens pré-aprovadas
scripts/update-data.js       coleta os dados na API do GitHub
.github/workflows/           sincronização por cron e por eventos
js/                          mapa, câmera, zoom e ciclo de 24 horas
js/scene/                    cena de tela cheia: céu, mar, esqueleto e atividades
```

## Limites conhecidos

- A atividade vem da busca de commits do GitHub, que conta commits públicos indexados. Repositórios privados e commits fora da branch padrão não aparecem, e a indexação pode atrasar.
- O arquipélago mostra até 1000 forks. A busca tem limite de requisições, então a atividade é atualizada em lotes: 120 forks em execuções agendadas e 20 nas causadas por estrelas, Issues ou forks. Uma rodada completa com 1000 forks pode levar cerca de dois dias.
- O GitHub Pages pode levar alguns minutos para publicar cada atualização.
