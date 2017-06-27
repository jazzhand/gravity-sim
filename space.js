// const scale = 1100000;

/**
 * @class
 * Represents an object in space with significant mass
 *
 */
class Entity {
  constructor(m, x, y, vx, vy, r) {
    this.mass = m; // real mass
    this.locX = x; // canvas x coordinate
    this.locY = y; // canvas y coordinate
    this.velX = vx; // real x velocity (m/s)
    this.velY = vy; // real y velocity (m/s)
    this.radius = r; // radius for canvas arcs
  }

  static distanceBetween(e1, e2) {
    let dx = e2.locX - e1.locX;
    let dy = e2.locY - e1.locY;
    return Math.sqrt(dx*dx + dy*dy);
  }
}

/**
 * @class
 * Represents the cosmological system of entities governed by newtonian physics
 */
class System {
  /**
   * The constructor of the System class. This creates a System object
   * which takes in a an array of astronomical entities.
   * @param {Entity[]} [ents] - The array of Entities that this System will
   * be initialised with.
   */
  constructor(scale, ents) {
    if (!ents) {
      this.entities = [];
    } else {
      this.entities = ents; // array of entities in the system
    }
    this.scale = scale; // real scale to canvas scale
    this.timeScale = 64;
    this.lastTime = performance.now(); // last time a physicsStep was taken
    this.dt = 1000/60; // intial time step, changes over time
  }

  // TODO implement ids/labels per entity
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

    /* This little line beneath causes huge dt when the animation is paused
       and returned to again. Which causes terrible anomilies in the physics.
       It was put in place to allow smooth animation despite varying framerate.
    */
    // this.dt = this.timeScale * (currentTime - this.lastTime);
    this.dt = this.timeScale * 1000/60;
    this.lastTime = currentTime;
  }

   getEntities() {
    return this.entities;
  }

  setSizeScale(ss) {
    this.scale = ss;
  }

  getSizeScale() {
    return this.scale;
  }

  setTimeScale(ts) {
    this.timeScale = ts;
  }

  getTimeScale() {
    return this.timeScale;
  }
}

/**
 * This class is the renderer to the System class.
 * It draws the System with all it's entities to the screen.
 */
class Renderer {
  /**
   * The contructor for the Renderer takes in an ID of a <canvas> element and
   * initialises the Renderer.
   * @param  {string} canvasID The ID string of the <canvas> which this Renderer
   *                           will draw on.
   * @return {Renderer}        A new Renderer object is returned
   */
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext('2d');
    this.origin = [this.canvas.width/2, this.canvas.height/2];
    this.animation = null;
    this.render = null;

    // Set the origin to the center of the canvas instead of the top left.
    this.ctx.translate(this.origin[0], this.origin[1]);
  }

  setAnimationRoutine(renderFunc) {
    this.render = renderFunc;
  }

  context() {
    return this.ctx;
  }

  animate() {
    if (!this.animation) {
      let parent = this;
      function animationStep(ts) {
        parent.animation = window.requestAnimationFrame(animationStep);
        parent.render(ts);
      }

      this.animation = window.requestAnimationFrame(animationStep);
    }
  }

  stop() {
    // attempt to stop the animation only if it is playing
    if (this.animation) {
      window.cancelAnimationFrame(this.animation);
      this.animation = null;
    }
  }

  clearBackground(col) {
    this.ctx.save();
    this.ctx.translate(-this.origin[0], -this.origin[1]);
    this.ctx.fillStyle = col;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "black";
    this.ctx.restore();
  }

  /**
   * Gets the current width of this Renderer's canvas element.
   * @return {Number} The width of the canvas.
   */
  canvasWidth() {
    return this.canvas.width;
  }

  /**
   * Gets the current height of this Renderer's canvas element.
   * @return {Number} The height of the canvas.
   */
  canvasHeight() {
    return this.canvas.height;
  }
}

class Controls {
  constructor(sys, rend, arrs) {
    this.system = sys;

    /* Controls Div */
    let arrSelector = document.getElementById("arrangement-selector");
    let settingsTbl = document.getElementById("settings-tbl");

    /* Input fields */
    let tsField = document.getElementById("ts");
    let ssField = document.getElementById("ss");

    /* Buttons */
    let startBut = document.getElementById("start-but");
    let pauseBut = document.getElementById("pause-but");
    let resetBut = document.getElementById('reset-but');

    /* Populate the select list */
    for(let i = 0; i < arrs.length; i++) {
      let opt = document.createElement("option");
      opt.innerHTML = arrs[i].title;
      opt.value = arrs[i].title;
      arrSelector.appendChild(opt);
    }

    /* Populate fields with initial values */
    tsField.value = sys.getTimeScale();
    ssField.value = sys.getSizeScale();

    settingsTbl.addEventListener("keyup", function(e) {
      if (e.keyCode == 13) {
        startBut.click();
      }
    });

    startBut.addEventListener("click", function() {
      sys.setTimeScale(tsField.value);
      sys.setSizeScale(ssField.value);
      rend.animate();
    });

    pauseBut.addEventListener("click", function() {
      rend.stop();
      let ctx = rend.context();
      ctx.fillStyle = "white";
      ctx.font = "bold 24px Monospace";
      ctx.fillText("PAUSED", -40, -100);
    });

    resetBut.addEventListener("click", function() {
      rend.stop();
      tsField.value = 64;
      ssField.value = 1100000;
    });
  }
}

// main execution
(function(){
  let arrangements = [
    {
      title: "Earth-Moon System",
      scale: 1100000,
      entities: {
        earth: [5.972e24, 0, 0, 0.01, -12.6, 6371000],
        moon: [7.347673e22, -384400000/1100000, 0, 0, 1023.006, 1737000]
      }
    },
    {
      title: "Sun-Earth System",
      scale: 11000000,
      entities: {
        sun: [1.989e30, 0, 0, 0, 0, 695700000],
        earth: [5.972e24, 0, -389, 1200, 0, 6371000]
      }
    }
  ];

  let scale = arrangements[0].scale;
  let earth = new Entity(...arrangements[0].entities.earth);
  let moon = new Entity(...arrangements[0].entities.moon);

  let system = new System(scale, [earth, moon]);
  let renderer = new Renderer('canvas');
  let controls = new Controls(system, renderer, arrangements);
  let ctx = renderer.context();

  // Some constants
  const canvasWidth = renderer.canvasWidth();
  const canvasHeight = renderer.canvasHeight();
  const colBG = "rgba(16, 16, 16, 0.8)";
  const colEarth = "#3af";
  const colMoon = "#e85";

  function drawVelocityVector(cont, angle, x, y) {
    cont.save();
    cont.translate(x, y);
    cont.strokeRect(-16, -16, 32, 32);
    cont.rotate(Math.PI/2 - angle);
    cont.beginPath();
    cont.moveTo(0, 12);
    cont.lineTo(0, -12);
    cont.moveTo(-4, -6);
    cont.lineTo(0, -12);
    cont.lineTo(4, -6);
    cont.stroke();
    cont.restore();
  }

  function drawEntity(cont, col, x, y, r) {
    cont.fillStyle = col;
    cont.beginPath();
    cont.arc(x, y, r, 0, 2*Math.PI);
    cont.shadowBlur = 4 * r;
    cont.shadowColor = col;
    cont.fill();
  }

  function animationStep(ts) {
    scale = system.getSizeScale();
    let bodies = system.getEntities();
    let b1 = bodies[0]; //earth
    let b2 = bodies[1]; //moon

    renderer.clearBackground(colBG);

    // Draw line between Earth and moon
    ctx.beginPath();
    ctx.moveTo(b1.locX, b1.locY);
    ctx.lineTo(b2.locX, b2.locY);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.2;
    ctx.stroke();

    // Draw the Earth
    drawEntity(ctx, colEarth, b1.locX, b1.locY, b1.radius/scale);

    // Draw the Moon
    drawEntity(ctx, colMoon, b2.locX, b2.locY, b2.radius/scale);

    // Stop drawing shadows/glows
    ctx.shadowBlur = 0;

    // Draw distance label
    ctx.fillStyle = "white";
    ctx.font = "12px Monospace";
    ctx.fillText("Distance between Earth and Moon: " +
    (scale/1000 * Entity.distanceBetween(b1, b2)).toPrecision(8) + " km",
     10 - canvasWidth/2, 20 - canvasHeight/2);

    // Draw Earth label
    ctx.fillText("Earth", b1.locX - 20, b1.locY - 28);

    // Draw Moon label
    ctx.fillText("Moon", b2.locX - 16, b2.locY - 28);

    // Draw center cross
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Draw other information
    let ev = Math.sqrt(b1.velX*b1.velX + b1.velY*b1.velY);
    let mv = Math.sqrt(b2.velX*b2.velX + b2.velY*b2.velY);
    ctx.fillText("Earth's velocity (m/s): " + ev.toPrecision(6),
      canvasWidth/2 - 300, 20 - canvasHeight/2);
    ctx.fillText("Moon's velocity (m/s): " + mv.toPrecision(6),
      canvasWidth/2 - 300, 40 - canvasHeight/2);

    let earthVelocityAngle = Math.atan2(-b1.velY, b1.velX);
    let moonVelocityAngle = Math.atan2(-b2.velY, b2.velX);

    // Draw Earth's velocity vector
    drawVelocityVector(ctx, earthVelocityAngle, b1.locX, b1.locY);
    // Draw Moon's velocity vector
    drawVelocityVector(ctx, moonVelocityAngle, b2.locX, b2.locY);

    system.physicsStep(ts);
  }

  renderer.setAnimationRoutine(animationStep);
  // renderer.animate();
})();
