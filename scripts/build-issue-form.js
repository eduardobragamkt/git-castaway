// Gera o Issue Form a partir de data/garrafas.json, a única fonte das mensagens.
// Rode `npm run build:form` depois de editar o catálogo.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOTTLE_FIELD_LABEL, optionText } from './lib.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function renderIssueForm(catalog) {
  const options = catalog.mensagens
    .map((message) => `        - ${JSON.stringify(optionText(message))}`)
    .join('\n');
  return `# Arquivo gerado por scripts/build-issue-form.js. Edite data/garrafas.json.
name: Mandar uma garrafa / Send a bottle
description: Escolha uma mensagem para a ilha principal. / Pick a message for the main island.
title: "Garrafa / Bottle"
body:
  - type: markdown
    attributes:
      value: |
        Só as mensagens desta lista aparecem no jogo. O título e qualquer outro texto nunca são exibidos.

        Only the messages on this list appear in the game. The title and any other text are never shown.
  - type: dropdown
    id: mensagem
    attributes:
      label: ${BOTTLE_FIELD_LABEL}
      description: A garrafa fica na praia por 30 minutos. / The bottle stays on the beach for 30 minutes.
      options:
${options}
    validations:
      required: true
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(await readFile(join(ROOT, 'data', 'garrafas.json'), 'utf8'));
  await writeFile(join(ROOT, '.github', 'ISSUE_TEMPLATE', 'garrafa.yml'), renderIssueForm(catalog));
  console.log('Formulário atualizado.');
}
