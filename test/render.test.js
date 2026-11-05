// Renderiza cada cena com um canvas simulado, para pegar erros em caminhos raros de desenho.

import assert from 'node:assert/strict';
import test from 'node:test';

function fakeContext() {
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name in target) return target[name];
        if (name === 'createImageData') {
          return (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) });
        }
        if (name === 'measureText') return () => ({ width: 10 });
        return () => {};
      },
      set(target, name, value) {
        target[name] = value;
        return true;
      },
    },
  );
}

globalThis.document = {
  createElement: () => ({ width: 1, height: 1, getContext: fakeContext }),
};

const { Scene } = await import('../js/scene/scene.js');
const { ACTIVITIES } = await import('../js/scene/activities.js');

function makeScene(options = {}, spec = {}) {
  return new Scene(
    {
      login: 'maria-dev',
      principal: true,
      energia: 'trabalhando',
      commits3d: 12,
      estrelas: 120,
      criadoEm: '2026-01-01T00:00:00Z',
      ...spec,
    },
    { hourFn: () => options.hour ?? 12, distantIslets: 4, ...options },
  );
}

function play(scene, seconds) {
  const context = fakeContext();
  for (let t = 0; t < seconds; t += 0.1) {
    scene.update(0.1);
    scene.render(context, 2, { x: 0, y: 0 }, 900, 700, t, 0.1);
  }
}

test('todas as versões de todas as atividades são desenhadas sem erro', () => {
  for (const [activity, definition] of Object.entries(ACTIVITIES)) {
    for (const variant of Object.keys(definition.variants)) {
      const scene = makeScene({ fixedActivity: activity, fixedVariant: variant });
      assert.doesNotThrow(() => play(scene, 34), `${activity}/${variant}`);
    }
  }
});

test('todas as datas e horários desenham decoração, céu e chapéu sem erro', () => {
  const dates = ['2027-02-08', '2027-03-16', '2027-06-24', '2027-07-04', '2027-10-30', '2027-12-24', '2027-12-31', '2027-05-10'];
  for (const date of dates) {
    for (const hour of [7, 12, 18.5, 23]) {
      const scene = makeScene({ hour, dateFn: () => new Date(`${date}T12:00:00`) });
      assert.doesNotThrow(() => play(scene, 6), `${date} às ${hour}h`);
    }
  }
});

test('clima e maré são desenhados sem erro', () => {
  for (const weatherOverride of ['chuva', 'calor', 'limpo']) {
    for (const tideOverride of [0, 0.5, 1]) {
      const scene = makeScene({ weatherOverride, tideOverride });
      assert.doesNotThrow(() => play(scene, 6), `${weatherOverride}, maré ${tideOverride}`);
    }
  }
});

test('ilha nova, sem data nem estrelas, também funciona', () => {
  const scene = makeScene({}, { estrelas: 0, commits3d: 0, energia: 'dormindo', criadoEm: null, principal: false });
  assert.doesNotThrow(() => play(scene, 40));
});

test('uma data comemorativa escolhe o chapéu sem afetar a rotina', () => {
  const scene = makeScene({ dateFn: () => new Date('2027-12-24T12:00:00') });
  assert.equal(scene.ambience.holiday, 'natal');
});

test('a garrafa abre o balão com mensagem nos dois idiomas e o fecha', () => {
  const order = [];
  const scene = makeScene({
    fixedActivity: 'bottle',
    onBottleOpen: (message) => order.push(['abriu', Boolean(message.pt), Boolean(message.en)]),
    onBottleClose: () => order.push(['fechou']),
  });
  play(scene, 13);
  assert.deepEqual(order.slice(0, 2), [['abriu', true, true], ['fechou']]);
  assert.equal(scene.bottleVisible, false);
});

test('a jangada e o jardim são desenhados em todos os estágios', () => {
  for (const days of [1, 4, 8, 11, 14, 20, 40, 90]) {
    const criadoEm = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const scene = makeScene({}, { criadoEm });
    assert.doesNotThrow(() => play(scene, 2), `dia ${days}`);
  }
});

test('a jangada lançada volta como destroço e depois recomeça', () => {
  const scene = makeScene({ fixedActivity: 'stretch' });
  play(scene, 0.2);
  scene.world.handle('raftLaunch');
  play(scene, 1);
  assert.equal(scene.world.raft.mode, 'floating');
  scene.world.handle('raftSink');
  play(scene, 2);
  assert.equal(scene.world.raft.mode, 'wreck');
  play(scene, 13);
  assert.equal(scene.world.raft.mode, 'beach');
});

test('marco do repositório entrega balão na ordem certa', () => {
  const order = [];
  const scene = makeScene();
  scene.celebrate(() => order.push('abriu'), () => order.push('fechou'));
  play(scene, 12);
  assert.deepEqual(order, ['abriu', 'fechou']);
});

test('todos os visitantes chegam e vão embora', () => {
  const scene = makeScene({ fixedActivity: 'stretch' });
  play(scene, 0.2);
  for (const type of ['aviao', 'balao', 'golfinhos', 'tartaruga', 'baleia', 'revoada']) {
    scene.world.handle(`visitor:${type}`);
  }
  assert.equal(scene.world.visitors.length, 6);
  play(scene, 40);
  assert.equal(scene.world.visitors.length, 0);
});
