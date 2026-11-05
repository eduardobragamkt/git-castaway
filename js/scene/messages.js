// Catálogo fixo das garrafas: toda mensagem existe sempre em português e inglês.

export const BOTTLE_MESSAGES = [
  { id: "wifi", pt: "Alguém aí? Ótima vista, péssimo Wi-Fi.", en: "Anyone out there? Great view, terrible Wi-Fi." },
  { id: "push-force", pt: "Fiz push --force e acordei aqui.", en: "I ran push --force and woke up here." },
  { id: "coconuts", pt: "Mande cocos. Aqui só tem merge conflict.", en: "Send coconuts. All I have are merge conflicts." },
  { id: "ship", pt: "Um navio passou. Não deixou nenhuma estrela.", en: "A ship went by. It left no star." },
  { id: "big-bug", pt: "Pesquei um bug. Era deste tamanho!", en: "I caught a bug. It was THIS big!" },
  { id: "shark", pt: "Hoje o tubarão revisou meu PR.", en: "The shark reviewed my PR today." },
  { id: "castle-beta", pt: "Meu castelo de areia ainda está em beta.", en: "My sandcastle is still in beta." },
  { id: "my-island", pt: "Funciona na minha ilha.", en: "Works on my island." },
  { id: "rescue", pt: "Sem resgate ainda. Seguimos em produção.", en: "No rescue yet. Still in production." },
  { id: "chest", pt: "Achei um baú. Dentro, só código legado.", en: "Found a chest. Only legacy code inside." },
  { id: "good-morning", pt: "Bom dia do outro lado do oceano!", en: "Good morning from across the ocean!" },
  { id: "good-night", pt: "Boa noite, náufrago. O deploy pode esperar.", en: "Good night, castaway. The deploy can wait." },
  { id: "palm-tree", pt: "Linda palmeira. Posso dar um fork?", en: "Nice palm tree. Can I fork it?" },
  { id: "keep-going", pt: "Sua ilha está linda. Continue commitando!", en: "Your island looks great. Keep committing!" },
  { id: "misses-you", pt: "Sua ilha sente sua falta. Volte a codar!", en: "Your island misses you. Come back and code!" },
  { id: "reply", pt: "Achei sua garrafa. Respondo com esta.", en: "Found your bottle. This is my reply." },
  { id: "tide", pt: "A maré levou minha branch.", en: "The tide took my branch." },
  { id: "map", pt: "Perdi o mapa, mas ainda tenho o git log.", en: "Lost the map, but I still have git log." },
  { id: "seagull", pt: "Uma gaivota roubou meu sanduíche e meu token.", en: "A seagull stole my sandwich and my token." },
  { id: "vim", pt: "Socorro! Alguém sabe como sair do Vim?", en: "Help! Does anyone know how to exit Vim?" },
  { id: "hut", pt: "Construí uma cabana. Sem testes.", en: "Built a hut. No tests." },
  { id: "build", pt: "O sol nasceu. O build, não.", en: "The sun came up. The build did not." },
  { id: "satellite", pt: "Acenei para um avião. Era um satélite.", en: "Waved at a plane. It was a satellite." },
  { id: "thanks", pt: "Obrigado por este arquipélago!", en: "Thanks for this archipelago!" },
];

// Sorteia uma mensagem diferente da última lida.
export function pickBottleMessage(lastId, random = Math.random) {
  const options = BOTTLE_MESSAGES.filter((message) => message.id !== lastId);
  return options[Math.floor(random() * options.length)];
}
