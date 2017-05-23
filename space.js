const scale = 1100000;

//export
class Entity {
  /* Represents an object in space with significant mass */
  constructor(m, x, y, vx, vy, r) {
    this.mass = m; // real mass
    this.locX = x; // canvas x coordinate
    this.locY = y; // canvas y coordinate
    this.velX = vx; // real x velocity (m/s)
    this.velY = vy; // real y velocity (m/s)
    this.radius = r / scale; // radius for canvas arcs
  }

  static distanceBetween(e1, e2) {
    let dx = e2.locX - e1.locX;
    let dy = e2.locY - e1.locY;
    return Math.sqrt(dx*dx + dy*dy);
  }
}
//export
class System {
  /* Represents the system of entities with newtonian physics */
  constructor(ents) {
    if (!ents) {
      this.entities = []
    } else {
      this.entities = ents; // array of entities in the system
    }
    this.scale = scale; // real scale to canvas scale
    this.lastTime = performance.now(); // last time a physicsStep was taken
    this.dt = 1/60; // intial time step, changes over time
    this.timeScale = 64;
  }

  // TODO implement graphical labels
  // TODO implement fixed entities that stay stationary
  addEntity(ent, label, fixed) {
    this.entities.push(ent);
  }

  physicsStep(currentTime) {
    const G = 6.674e-11; // Gravitational constant
    const numEnts = this.entities.length;

    let xForces = Array.apply(null, Array(numEnts)).map(Number.prototype.valueOf, 0);
    let yForces = Array.apply(null, Array(numEnts)).map(Number.prototype.valueOf, 0);

    // Calculate the forces between each Entity in the system
    for (let i = 0; i < numEnts - 1; i++) {
      for (let j = i + 1; j < numEnts; j++) {
        let ent1 = this.entities[i],
            ent2 = this.entities[j];
        let dx = (ent2.locX - ent1.locX) * this.scale,
            dy = (ent2.locY - ent1.locY) * this.scale;

        let r2 = Math.pow(dx, 2) + Math.pow(dy, 2),
            r = Math.sqrt(r2),
            force = (G * ent1.mass * ent2.mass) / r2;

          xForces[i] += force * dx/r;
          xForces[j] -= force * dx/r;
          yForces[i] += force * dy/r;
          yForces[j] -= force * dy/r;
      }
    }

    for (let i = 0; i < numEnts; i++) {
      let obj = this.entities[i];

      obj.velX += this.dt * xForces[i] / obj.mass;
      obj.velY += this.dt * yForces[i] / obj.mass;

      obj.locX += this.dt * obj.velX/(this.scale);
      obj.locY += this.dt * obj.velY/(this.scale);
    }

    this.dt = this.timeScale * (currentTime - this.lastTime);
    this.lastTime = currentTime;
  }

   getEntities() {
    return this.entities;
  }

  setTimeScale(ts) {
    this.timeScale = ts;
  }
}

//export
class Renderer {
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext('2d');
    this.animation = null;
    this.render = null;
  }

  setAnimationRoutine(renderFunc) {
    this.render = renderFunc;
  }

  context() {
    return this.ctx;
  }

  animate() {
    let parent = this;
    function animationStep(ts) {
      window.requestAnimationFrame(animationStep);
      parent.render(ts);
    }

    this.animation = window.requestAnimationFrame(animationStep);
  }

  stop() {
    if (!this.animation) {
      window.cancelAnimationFrame(this.animation);
    }
  }

  canvasWidth() {
    return this.canvas.width;
  }

  canvasHeight() {
    return this.canvas.height;
  }
}

// main execution
(function(){
  let earth = new Entity(5.972e24, 400, 400, 0.2, -12, 6371000);
  let moon = new Entity(7.347673e22, 400 - 384400000/scale, 400, 0, 1023.006, 1737000);

  let system = new System([earth, moon], scale);
  let renderer = new Renderer('canvas');
  let ctx = renderer.context();

  // Some constants
  const canvasWidth = renderer.canvasWidth();
  const canvasHeight = renderer.canvasHeight();
  const colBG = "rgba(16, 16, 16, 0.8)";
  const colEarth = "#3af";
  const colMoon = "#e85";

  function animationStep(ts) {
    ctx.fillStyle = colBG;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "black";

    let bodies = system.getEntities();
    let b1 = bodies[0]; //earth
    let b2 = bodies[1]; //moon

    // Draw line between Earth and moon
    ctx.beginPath();
    ctx.moveTo(b1.locX, b1.locY);
    ctx.lineTo(b2.locX, b2.locY);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.2;
    ctx.stroke();

    // Draw the earth
    ctx.fillStyle = colEarth;
    ctx.beginPath();
    ctx.arc(b1.locX, b1.locY, b1.radius, 0, 2*Math.PI);
    ctx.fill();

    //Draw the moon
    ctx.fillStyle = colMoon;
    ctx.beginPath();
    ctx.arc(b2.locX, b2.locY, b2.radius, 0, 2*Math.PI);
    ctx.fill();

    // Draw distance label
    ctx.fillStyle = "white";
    ctx.font = "12px Monospace";
    ctx.fillText((scale/1000 * Entity.distanceBetween(b1, b2)).toPrecision(8) + " km",
     0 + b1.locX + 0.4*(b2.locX - b1.locX),
    20 + b1.locY + 0.4*(b2.locY - b1.locY));

    //Draw Earth label
    ctx.fillText("Earth", b1.locX - 20, b1.locY - 28);

    //Draw Moon label
    ctx.fillText("Moon", b2.locX - 16, b2.locY - 28);

    system.physicsStep(ts);
  }

  system.setTimeScale(8);
  renderer.setAnimationRoutine(animationStep);
  renderer.animate();
})();
