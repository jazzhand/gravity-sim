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
}
//export
class System {
  /* Represents the system of entities with newtonian physics */
  constructor(ents) {
    this.entities = ents; // array of entities in the system
    this.scale = scale; // real scale to canvas scale
    this.lastTime = performance.now(); // last time a physicsStep was taken
    this.dt = 1/60; // intial time step, changes over time
    this.timeScale = 64;
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
}

// main execution
(function(){
  // Some constants
  const colBG = "rgba(20, 20, 20, 0.6)";
  const colEarth = "#3bf";
  const colMoon = "#e66";
  const canvasWidth = 800;
  const canvasHeight = 800;

  let earth = new Entity(5.972e24, 400, 400, 0.1, -12, 6371000);
  let moon = new Entity(7.347673e22, 400 - 384400000/scale, 400, 0, 1023.006, 1737000);

  let system = new System([earth, moon], scale);
  let renderer = new Renderer('canvas');
  let ctx = renderer.context();

  function animationStep(ts) {
    ctx.fillStyle = colBG;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "black";

    let bodies = system.getEntities();
    let b1 = bodies[0]; //earth
    let b2 = bodies[1]; //moon

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

    system.physicsStep(ts);
  }

  renderer.setAnimationRoutine(animationStep);
  renderer.animate();
})();
