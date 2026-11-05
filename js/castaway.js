// Máquina de estados do náufrago. O JSON escolhe a rotina; cada rotina é uma fila de passos.

const WALK_SPEED = 20;
const BOTTLE_CHANCE = 0.12;

function between(min, max) {
  return min + Math.random() * (max - min);
}

// Mapeia o nível de energia do JSON para as animações.
export const ROUTINES = {
  dormindo(c) {
    return [
      { walk: c.spots.rest },
      { pose: 'sleep', seconds: between(9, 15), effect: 'zzz' },
      { walk: c.spots.rock },
      { pose: 'sad', seconds: between(5, 8), face: -1 },
    ];
  },
  pescando(c) {
    return [
      { walk: c.spots.shore },
      { pose: 'sit', seconds: between(9, 16), effect: 'fishing', face: 1 },
      { pose: 'idle', seconds: 2.4, effect: 'catch', face: 1 },
      { walk: c.spots.center },
      { pose: 'idle', seconds: between(1.5, 3) },
    ];
  },
  trabalhando(c) {
    const fishBreak = Math.random() > 0.65;
    return [
      { walk: c.spots.workbench },
      { pose: 'work', seconds: between(6, 10), effect: 'hammer', face: 1 },
      { walk: c.spots.center },
      { pose: 'idle', seconds: 1.2 },
      ...(fishBreak
        ? [
            { walk: c.spots.shore },
            { pose: 'sit', seconds: between(5, 8), effect: 'fishing', face: 1 },
            { pose: 'idle', seconds: 2.2, effect: 'catch', face: 1 },
          ]
        : [{ walk: c.spots.workbench }, { pose: 'work', seconds: between(4, 7), effect: 'hammer', face: 1 }]),
    ];
  },
};

export class Castaway {
  constructor(energy, spots) {
    this.energy = energy;
    this.spots = spots;
    this.x = spots.center.x;
    this.y = spots.center.y;
    this.face = 1;
    this.queue = [];
    this.step = null;
    this.clock = 0;
    this.stepTime = 0;
    this.pose = 'idle';
    this.effect = null;
    this.bottleOut = false;
  }

  // De vez em quando chega uma garrafa: ele pega, lê e volta à rotina.
  bottleSteps() {
    return [
      { walk: this.spots.bottle, begin: () => { this.bottleOut = true; } },
      { pose: 'bend', seconds: 0.9, face: 1, then: () => { this.bottleOut = false; } },
      { pose: 'read', seconds: 3.5, effect: 'paper', face: 1 },
    ];
  }

  nextStep() {
    if (this.queue.length === 0) {
      const wantsBottle = this.energy !== 'dormindo' && Math.random() < BOTTLE_CHANCE;
      this.queue = [...(wantsBottle ? this.bottleSteps() : []), ...ROUTINES[this.energy](this)];
    }
    this.step = this.queue.shift();
    this.stepTime = 0;
    this.effect = this.step.effect ?? null;
    if (this.step.face) this.face = this.step.face;
    this.step.begin?.();
  }

  update(dt) {
    this.clock += dt;
    if (!this.step) this.nextStep();
    const { step } = this;

    if (step.walk) {
      const dx = step.walk.x - this.x;
      const dy = step.walk.y - this.y;
      const distance = Math.hypot(dx, dy);
      const travel = WALK_SPEED * dt;
      if (distance <= travel) {
        this.x = step.walk.x;
        this.y = step.walk.y;
        this.step = null;
        return;
      }
      this.x += (dx / distance) * travel;
      this.y += (dy / distance) * travel;
      if (Math.abs(dx) > 0.5) this.face = dx > 0 ? 1 : -1;
      this.pose = Math.floor(this.clock * 7) % 2 === 0 ? 'walk1' : 'walk2';
      return;
    }

    this.stepTime += dt;
    this.pose = step.pose === 'work' ? (Math.floor(this.clock * 5) % 2 === 0 ? 'work1' : 'work2') : step.pose;
    if (this.stepTime >= step.seconds) {
      step.then?.();
      this.step = null;
    }
  }
}
