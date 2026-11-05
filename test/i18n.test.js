import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_LANGUAGE, LANGUAGES, TEXTS, initialLanguage } from '../js/core/i18n.js';
import { BOTTLE_MESSAGES, pickBottleMessage } from '../js/scene/messages.js';

function assertSameShape(a, b, path = 'TEXTS') {
  if (typeof a === 'function') {
    assert.equal(typeof b, 'function', path);
    for (const value of [a('x', 1), b('x', 1), a(1), b(1)]) assert.ok(String(value).length > 0, path);
    return;
  }
  if (Array.isArray(a)) {
    assert.ok(Array.isArray(b), path);
    assert.equal(a.length, b.length, `${path}: tamanho`);
    a.forEach((item, index) => assertSameShape(item, b[index], `${path}[${index}]`));
    return;
  }
  if (typeof a === 'object') {
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), path);
    for (const key of Object.keys(a)) assertSameShape(a[key], b[key], `${path}.${key}`);
    return;
  }
  assert.equal(typeof b, 'string', path);
  assert.ok(a.trim().length > 0 && b.trim().length > 0, `${path}: texto vazio`);
}

test('todo texto da tela existe em inglês e português', () => {
  assertSameShape(TEXTS.en, TEXTS.pt);
});

test('o idioma padrão é inglês, e a escolha guardada é respeitada', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.deepEqual(LANGUAGES, ['en', 'pt']);
  assert.equal(initialLanguage(null), 'en');
  assert.equal(initialLanguage('fr'), 'en');
  assert.equal(initialLanguage('pt'), 'pt');
});

test('os textos aprovados estão no pop-up Leia-me', () => {
  assert.equal(TEXTS.pt.readMe, 'Leia-me');
  assert.match(TEXTS.pt.aboutParagraphs[0], /Johnny Castaway/);
  assert.match(TEXTS.en.aboutParagraphs[0], /Johnny Castaway/);
  assert.match(TEXTS.pt.aboutNote, /sem vínculo/);
  assert.match(TEXTS.en.aboutNote, /not affiliated/);
  assert.equal(TEXTS.pt.forkAction, 'Ir pra criação da minha ilha');
  assert.equal(TEXTS.en.forkAction, 'Go create my island');
  assert.equal(TEXTS.pt.aboutParagraphs.at(-1), 'Fique à vontade para só ficar olhando. Sempre foi esse o encanto.');
  assert.equal(TEXTS.en.aboutParagraphs.at(-1), 'Feel free to just sit back and watch. That was always the charm.');
  assert.match(TEXTS.pt.aboutParagraphs.at(-2), /^Os dias na ilha nunca são iguais\./);
  assert.match(TEXTS.en.aboutParagraphs.at(-2), /^No two days on the island are the same\./);
});

test('o pop-up do fork não pede para ativar página própria', () => {
  for (const language of LANGUAGES) {
    assert.doesNotMatch(TEXTS[language].forkSteps.join(' '), /pages/i);
  }
});

test('toda garrafa tem mensagem em português e inglês', () => {
  assert.equal(BOTTLE_MESSAGES.length, 24);
  for (const message of BOTTLE_MESSAGES) {
    assert.ok(message.pt?.trim(), `${message.id}: sem português`);
    assert.ok(message.en?.trim(), `${message.id}: sem inglês`);
    assert.notEqual(message.pt, message.en, `${message.id}: textos iguais`);
  }
  assert.equal(new Set(BOTTLE_MESSAGES.map((message) => message.id)).size, BOTTLE_MESSAGES.length);
});

test('a mesma mensagem não se repete em seguida', () => {
  let last = null;
  for (let i = 0; i < 300; i += 1) {
    const message = pickBottleMessage(last);
    assert.notEqual(message.id, last);
    last = message.id;
  }
});
