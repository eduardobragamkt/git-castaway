// Todos os textos da tela pública, sempre em inglês e português. O inglês é o padrão, e a
// escolha do visitante fica guardada no navegador.

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = ['en', 'pt'];

export const TEXTS = {
  en: {
    canvasLabel: 'An ocean with pixel art islands, one for each participant',
    archipelago: 'Archipelago mode: drag to explore',
    islandOf: (login) => `${login}'s island`,
    offline: 'GitHub data is unavailable right now',
    back: 'Back to main island',
    map: 'View map',
    fork: 'Create my island',
    readMe: 'Read me',
    profile: 'View GitHub profile',
    enter: 'Enter island',
    commits: (count) => `${count} public ${count === 1 ? 'commit' : 'commits'} in 3 days`,
    days: (count) => `Day ${count} on the island`,
    milestones: {
      primeiraEstrela: 'First star! The island has fans.',
      dezEstrelas: 'Ten stars! The island is getting famous.',
      cemEstrelas: 'A hundred stars! What an archipelago.',
      primeiroFork: 'First fork! There is a neighbor island.',
      dezCommits: 'Ten commits in 3 days! So productive.',
      aniversario: 'Happy birthday, island!',
    },
    next: (name, stars) => `Next upgrade: ${name} (★ ${stars})`,
    complete: 'All upgrades unlocked',
    energy: { dormindo: 'Sleeping', pescando: 'Fishing', trabalhando: 'Full steam ahead' },
    close: 'Close',
    languageMenu: 'Language',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit to screen',
    zoomMenu: 'Screen zoom',
    fullscreenEnter: 'Enter full screen',
    fullscreenExit: 'Exit full screen',
    forkTitle: 'Create my island',
    forkSteps: [
      'Sign in to your GitHub account, or create one for free.',
      'Click the button below to open the fork creation page.',
      'On GitHub, keep the options as they are and click Create fork.',
      'In a few minutes, your island appears in the archipelago, with no further setup.',
    ],
    forkAction: 'Go create my island',
    aboutTitle: 'About Git Castaway',
    aboutParagraphs: [
      'Some programs stay with us for a long time. For me, one of them is Johnny Castaway, the classic 1992 screensaver: a castaway, a tiny island, and little stories unfolding while the computer rested.',
      'I always loved the idea that there was life in there, even when nobody was watching. One day I wondered: what if that feeling became a game? What if everyone could have their own island, powered by what they create?',
      "That is how Git Castaway was born. Every fork brings an island to life, and every castaway lives to the rhythm of its owner's public commits. He never leaves the island, but the archipelago can keep on growing.",
      "No two days on the island are the same. He fishes, tends his garden, keeps working on a raft that refuses to cooperate, and battles the coconuts, which usually win. His mood follows his owner's public commits: when the work is flowing, he is full of energy; without any, he spends much of his time asleep or feeling down. The sky, the weather and the tide change too, and every now and then someone or something shows up.",
      'Feel free to just sit back and watch. That was always the charm.',
    ],
    aboutNote:
      'An independent fan project, not affiliated with the owners of Johnny Castaway. The character, art and scenes are original.',
  },
  pt: {
    canvasLabel: 'Oceano com ilhas de pixel art, uma para cada participante',
    archipelago: 'Modo Arquipélago: arraste para navegar',
    islandOf: (login) => `Ilha de ${login}`,
    offline: 'Sem dados do GitHub no momento',
    back: 'Voltar à ilha principal',
    map: 'Ver mapa',
    fork: 'Criar minha ilha',
    readMe: 'Leia-me',
    profile: 'Ver perfil no GitHub',
    enter: 'Entrar na ilha',
    commits: (count) => `${count} ${count === 1 ? 'commit público' : 'commits públicos'} em 3 dias`,
    days: (count) => `Dia ${count} na ilha`,
    milestones: {
      primeiraEstrela: 'Primeira estrela! A ilha já tem fãs.',
      dezEstrelas: 'Dez estrelas! A ilha está ficando famosa.',
      cemEstrelas: 'Cem estrelas! Que arquipélago é este?',
      primeiroFork: 'Primeiro fork! Já tem ilha vizinha.',
      dezCommits: 'Dez commits em 3 dias! Que produtividade.',
      aniversario: 'Feliz aniversário, ilha!',
    },
    next: (name, stars) => `Próxima melhoria: ${name} (★ ${stars})`,
    complete: 'Todas as melhorias conquistadas',
    energy: { dormindo: 'Dormindo', pescando: 'Pescando de boa', trabalhando: 'A todo vapor' },
    close: 'Fechar',
    languageMenu: 'Idioma',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    zoomFit: 'Ajustar à tela',
    zoomMenu: 'Zoom da tela',
    fullscreenEnter: 'Entrar em tela cheia',
    fullscreenExit: 'Sair da tela cheia',
    forkTitle: 'Criar minha ilha',
    forkSteps: [
      'Entre na sua conta do GitHub, ou crie uma de graça.',
      'Clique no botão abaixo para abrir a criação do fork.',
      'No GitHub, mantenha as opções como estão e clique em Create fork.',
      'Em poucos minutos, sua ilha aparece no arquipélago, sem mais nenhuma configuração.',
    ],
    forkAction: 'Ir pra criação da minha ilha',
    aboutTitle: 'Sobre o Git Castaway',
    aboutParagraphs: [
      'Alguns programas ficam com a gente por muito tempo. Para mim, um deles é o Johnny Castaway, o clássico protetor de tela de 1992: um náufrago, uma ilhota e pequenas histórias acontecendo enquanto o computador descansava.',
      'Sempre gostei da ideia de que havia vida ali, mesmo quando ninguém estava olhando. Um dia, pensei: e se essa sensação virasse um jogo? E se cada pessoa pudesse ter a própria ilha, movida por aquilo que cria?',
      'Assim nasceu o Git Castaway. Cada fork faz nascer uma ilha, e cada náufrago vive no ritmo dos commits públicos do seu dono. Ele nunca sai da ilha, mas o arquipélago pode crescer sem parar.',
      'Os dias na ilha nunca são iguais. Ele pesca, cuida do jardim, insiste em uma jangada que não colabora e briga com os cocos, que quase sempre vencem. O humor dele acompanha os commits públicos do dono: com o trabalho em dia, sobra energia; sem nenhum, ele passa boa parte do tempo dormindo ou cabisbaixo. O céu, o clima e a maré também mudam, e de vez em quando alguém ou alguma coisa aparece por lá.',
      'Fique à vontade para só ficar olhando. Sempre foi esse o encanto.',
    ],
    aboutNote:
      'Projeto independente de um fã, sem vínculo com os donos de Johnny Castaway. Personagem, arte e cenas são originais.',
  },
};

export function initialLanguage(stored) {
  return LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
}
