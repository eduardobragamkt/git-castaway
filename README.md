# Git Castaway

Um arquipélago vivo em pixel art, movido pela atividade pública do GitHub. Cada fork vira uma ilha, e cada náufrago vive de acordo com os commits públicos do seu dono.

**Jogue:** https://eduardobragamkt.github.io/git-castaway/

Personagem, arte e código são originais. O projeto é uma homenagem ao gênero de "ilhas de área de trabalho" dos anos 90, sem usar assets de nenhum outro jogo ou protetor de tela.

## Como jogar

| Ação no GitHub | O que acontece no jogo |
| --- | --- |
| Commits públicos nos últimos 3 dias | 0: dorme ou fica triste. 1 a 4: pesca com calma. 5 ou mais: trabalha a todo vapor. |
| Dar uma estrela | Cai uma caixa de suprimentos, e a ilha ganha melhorias: 1, 3, 5, 10, 25 e 100 estrelas. |
| [Dar um fork](https://github.com/eduardobragamkt/git-castaway/fork) | Nasce uma nova ilha no arquipélago. |

## Como explorar

- **Mapa do arquipélago:** arraste para navegar e clique em uma ilha para entrar na cena dela.
- **Cena da ilha:** um quadro de tela cheia que segue o horário local do visitante, do amanhecer à noite.
- **Personagem:** clique no náufrago para ver energia, estrelas, próxima melhoria e o perfil público do dono da ilha no GitHub.
- **Zoom e tela cheia:** use o menu da tela, a roda do mouse, o gesto de pinça ou as teclas `+`, `-` e `0`. O botão de tela cheia não aparece em navegadores sem esse recurso, como o do iPhone.
- **Idioma:** inglês por padrão, com os botões `EN | PT` no painel do título. A escolha fica guardada no navegador.
- **Endereço de cada ilha:** `https://eduardobragamkt.github.io/git-castaway/?ilha=login`.

Sem mexer no mouse por alguns segundos, os painéis somem e sobra só a ilha.

## A vida na ilha

O náufrago sorteia dezenas de cenas conforme commits, hora, estrelas, clima e maré: pesca, coco, mergulho, fogo, leitura, pedidos de ajuda que nunca funcionam, visitantes, invasão de bugs, `merge conflict` entre caranguejos e garrafas que chegam do mar, com mensagens em português e inglês.

A ilha também tem chuva e calor, maré que sobe e desce, datas comemorativas e marcos reais do repositório, como a primeira estrela e o aniversário. Tudo vem de dados públicos e do relógio do visitante, então qualquer fork funciona sem configuração.

Com o tempo, cada ilha ganha um jardim, que cresce com os dias e floresce com commits públicos, e uma jangada que nunca fica pronta: no teste, ela sempre afunda, e ele recomeça. O náufrago nunca sai da ilha.

## Sua própria ilha

1. Entre na sua conta do GitHub.
2. Dê um [fork neste repositório](https://github.com/eduardobragamkt/git-castaway/fork).
3. Em poucos minutos, sua ilha aparece no arquipélago, sem mais nenhuma configuração.

O jogo tem uma única URL pública. Forks diretos aparecem logo após a sincronização, e forks de forks entram na sincronização agendada, em até 6 horas. Se alguém ativar o GitHub Pages no fork, a página leva à ilha dessa pessoa na URL principal.

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
| `?ilha=login` | Abre a ilha daquele usuário; funciona também na URL pública |
| `?visao=cena` ou `?visao=mapa` | Força a visão inicial |
| `?hora=21` | Fixa o horário do céu e da luz |
| `?cena=coconut` | Repete uma atividade do náufrago (veja `js/scene/activities.js`) |
| `?cena=coconut&variante=stone` | Repete uma versão específica da atividade |
| `?data=2026-12-25T21:00` | Simula uma data, útil para as datas comemorativas |
| `?clima=chuva` ou `?clima=calor` | Força o clima |
| `?mare=0` | Força a maré: de `0` (baixa) a `1` (alta) |

Os parâmetros `dados`, `visao`, `hora`, `cena`, `variante`, `data`, `clima` e `mare` só funcionam em ambiente local.

```text
data/arquipelago.json        estado do jogo, gerado pelo workflow
js/i18n.js                   textos da interface em inglês e português
js/scene/messages.js         catálogo de mensagens das garrafas
scripts/update-data.js       coleta os dados na API do GitHub
.github/workflows/           sincronização por cron e por eventos
js/                          mapa, câmera, zoom e ciclo de 24 horas
js/scene/                    cena de tela cheia: céu, mar, esqueleto e atividades
```

## Limites conhecidos

- A atividade vem da busca de commits do GitHub, que conta commits públicos indexados. Repositórios privados e commits fora da branch padrão não aparecem, e a indexação pode atrasar.
- O arquipélago mostra até 1000 forks, com até 3 níveis de forks de forks. A busca tem limite de requisições, então a atividade é atualizada em lotes: 120 forks em execuções agendadas e 20 nas causadas por estrelas ou forks. Uma rodada completa com 1000 forks pode levar cerca de dois dias.
- O GitHub Pages pode levar alguns minutos para publicar cada atualização.
