// Executa os roteiros de js/scene/activities.js. Não desenha nada, o que permite testar
// toda a lógica do personagem sem navegador.

import {
  ACTIVITIES,
  SCENE_SPOTS,
  activityShares,
  closingScript,
  openingScript,
  pauseBeat,
  pickActivity,
  pickVariant,
  routeTo,
} from './activities.js';
import { POSES, blendPose, walkPose } from './poses.js';

const WALK_SPEED = 30;
const RUN_SPEED = 62;
const POSE_SPEED = 11;
const MIN_ACTIONS_PER_SESSION = 6;
const MAX_ACTIONS_PER_SESSION = 12;
const RECENT_MEMORY = 3;
const LONG_WALK = 110;

export class Actor {
  constructor({
    energy,
    commits = 0,
    stars = 0,
    night = () => false,
    onEvent = () => {},
    fixedActivity = null,
    fixedVariant = null,
    random = Math.random,
  }) {
    this.energy = energy;
    this.commits = commits;
    this.stars = stars;
    this.isNight = night;
    this.onEvent = onEvent;
    this.fixedActivity = fixedActivity;
    this.fixedVariant = fixedVariant;
    this.random = random;
    this.x = SCENE_SPOTS.center.x;
    this.y = SCENE_SPOTS.center.y;
    this.facing = 1;
    this.item = null;
    this.effect = null;
    this.mood = energy === 'dormindo' ? 'sleepy' : 'calm';
    this.pose = POSES.stand;
    this.lift = 0;
    this.task = null;
    this.step = null;
    this.stepTime = 0;
    this.stepLiftStart = 0;
    this.route = null;
    this.speed = WALK_SPEED;
    this.phase = 0;
    this.current = null;
    this.walking = false;
    this.stage = 'idle';
    this.actionsLeft = 0;
    this.recent = [];
    this.lastVariant = {};
    this.timeSpent = {};
  }

  between(min, max) {
    return min + this.random() * (max - min);
  }

  context() {
    return { energy: this.energy, commits: this.commits, stars: this.stars, night: this.isNight() };
  }

  // Interrompe a atividade atual e volta à rotina quando o novo roteiro termina.
  interrupt(script) {
    this.item = null;
    this.effect = null;
    this.lift = 0;
    this.task = script;
    this.step = null;
    this.route = null;
    this.stage = 'interrupt';
    this.current = 'interrupt';
  }

  startActivity(name) {
    const variant = this.fixedVariant && ACTIVITIES[name].variants[this.fixedVariant]
      ? this.fixedVariant
      : pickVariant(name, this.lastVariant[name], this.random);
    this.lastVariant[name] = variant;
    this.current = name;
    this.stage = 'action';
    this.recent = [...this.recent, name].slice(-RECENT_MEMORY);
    this.task = ACTIVITIES[name].variants[variant](this);
  }

  startPause() {
    this.current = 'pause';
    this.stage = 'pause';
    this.task = pauseBeat(this);
  }

  startAction() {
    const name = pickActivity(this.context(), this.recent, this.random, activityShares(this.timeSpent));
    this.startActivity(name);
  }

  // Sessão: abertura, de 6 a 12 ações separadas por pausas e um encerramento.
  nextTask() {
    if (this.fixedActivity) {
      this.startActivity(this.fixedActivity);
      return;
    }
    if (this.stage === 'opening' || this.stage === 'pause' || this.stage === 'interrupt') {
      this.startAction();
    } else if (this.stage === 'action') {
      this.actionsLeft -= 1;
      if (this.actionsLeft > 0) {
        this.startPause();
      } else {
        this.current = 'closing';
        this.stage = 'closing';
        this.task = closingScript(this);
      }
    } else {
      this.actionsLeft = MIN_ACTIONS_PER_SESSION + Math.floor(this.random() * (MAX_ACTIONS_PER_SESSION - MIN_ACTIONS_PER_SESSION + 1));
      this.current = 'opening';
      this.stage = 'opening';
      this.task = openingScript(this);
    }
  }

  advance() {
    while (!this.step) {
      if (!this.task) this.nextTask();
      const { value, done } = this.task.next();
      if (done) {
        this.task = null;
        continue;
      }
      if (value.set) Object.assign(this, value.set);
      else if (value.emit) this.onEvent(value.emit);
      else this.beginStep(value);
    }
  }

  beginStep(step) {
    this.step = step;
    this.stepTime = 0;
    this.stepLiftStart = this.lift;
    if (!step.walk) return;
    this.route = routeTo(this, step.walk);
    const distance = Math.hypot(step.walk.x - this.x, step.walk.y - this.y);
    const longRun = distance > LONG_WALK && this.random() < 0.2;
    this.speed = step.run || longRun ? RUN_SPEED : WALK_SPEED;
  }

  updateWalk(dt) {
    const target = this.route[0];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const travel = this.speed * dt;
    const running = this.speed > WALK_SPEED;
    this.phase += dt * (running ? 15 : 9);
    this.pose = blendPose(this.pose, walkPose(this.phase, running), Math.min(1, dt * 22));
    if (distance <= Math.max(travel, 0.01)) {
      this.x = target.x;
      this.y = target.y;
      this.route.shift();
      if (this.route.length === 0) {
        this.route = null;
        this.step = null;
      }
      return;
    }
    this.x += (dx / distance) * travel;
    this.y += (dy / distance) * travel;
    if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 1 : -1;
  }

  update(dt) {
    this.advance();
    const { step } = this;
    this.walking = Boolean(step.walk);
    if (ACTIVITIES[this.current]) {
      this.timeSpent[this.current] = (this.timeSpent[this.current] ?? 0) + dt;
    }

    if (step.walk) {
      this.updateWalk(dt);
      return;
    }

    this.stepTime += dt;
    const target = step.cycle
      ? POSES[step.cycle[Math.floor(this.stepTime * step.hz * step.cycle.length) % step.cycle.length]]
      : POSES[step.pose];
    this.pose = blendPose(this.pose, target, Math.min(1, dt * POSE_SPEED * (step.cycle ? Math.max(1, step.hz / 1.5) : 1)));
    if (step.lift !== undefined) {
      const progress = Math.min(1, this.stepTime / step.seconds);
      this.lift = this.stepLiftStart + (step.lift - this.stepLiftStart) * progress;
    }
    if (this.stepTime >= step.seconds) this.step = null;
  }
}
