// Executa os roteiros de js/scene/activities.js. Não desenha nada, o que permite testar
// toda a lógica do personagem sem navegador.

import { ACTIVITIES, SCENE_SPOTS, pickActivity } from './activities.js';
import { POSES, blendPose, walkPose } from './poses.js';

const WALK_SPEED = 30;
const POSE_SPEED = 11;

export class Actor {
  constructor({ energy, pushes = 0, stars = 0, night = () => false, onEvent = () => {}, fixedActivity = null, random = Math.random }) {
    this.energy = energy;
    this.pushes = pushes;
    this.stars = stars;
    this.isNight = night;
    this.onEvent = onEvent;
    this.fixedActivity = fixedActivity;
    this.random = random;
    this.x = SCENE_SPOTS.center.x;
    this.y = SCENE_SPOTS.center.y;
    this.facing = 1;
    this.item = null;
    this.effect = null;
    this.mood = energy === 'dormindo' ? 'sleepy' : 'calm';
    this.pose = POSES.stand;
    this.task = null;
    this.step = null;
    this.stepTime = 0;
    this.phase = 0;
    this.current = null;
    this.walking = false;
  }

  between(min, max) {
    return min + this.random() * (max - min);
  }

  context() {
    return { energy: this.energy, pushes: this.pushes, stars: this.stars, night: this.isNight() };
  }

  // Interrompe a atividade atual e volta ao sorteio quando o novo roteiro termina.
  interrupt(script) {
    this.item = null;
    this.effect = null;
    this.task = script;
    this.step = null;
  }

  nextActivity() {
    const name = this.fixedActivity ?? pickActivity(this.context(), this.current, this.random);
    this.current = name;
    this.task = ACTIVITIES[name].run(this);
  }

  advance() {
    while (!this.step) {
      if (!this.task) this.nextActivity();
      const { value, done } = this.task.next();
      if (done) {
        this.task = null;
        continue;
      }
      if (value.set) Object.assign(this, value.set);
      else if (value.emit) this.onEvent(value.emit);
      else {
        this.step = value;
        this.stepTime = 0;
      }
    }
  }

  update(dt) {
    this.advance();
    const { step } = this;
    this.walking = Boolean(step.walk);

    if (step.walk) {
      const dx = step.walk.x - this.x;
      const dy = step.walk.y - this.y;
      const distance = Math.hypot(dx, dy);
      const travel = WALK_SPEED * dt;
      if (distance <= Math.max(travel, 0.01)) {
        this.x = step.walk.x;
        this.y = step.walk.y;
        this.step = null;
        return;
      }
      this.x += (dx / distance) * travel;
      this.y += (dy / distance) * travel;
      if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 1 : -1;
      this.phase += dt * 9;
      this.pose = blendPose(this.pose, walkPose(this.phase), Math.min(1, dt * 22));
      return;
    }

    this.stepTime += dt;
    const target = step.cycle
      ? POSES[step.cycle[Math.floor(this.stepTime * step.hz * step.cycle.length) % step.cycle.length]]
      : POSES[step.pose];
    this.pose = blendPose(this.pose, target, Math.min(1, dt * POSE_SPEED * (step.cycle ? Math.max(1, step.hz / 1.5) : 1)));
    if (this.stepTime >= step.seconds) this.step = null;
  }
}
