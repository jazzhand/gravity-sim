// Main module
// Some constants
const scale = 1100000; // real scale to canvas scale
const colBG = "rgba(20, 20, 20, 0.5)";
const colEarth = "#39f";
const colMoon = "#f82";
const canvasWidth = 800;
const canvasHeight = 800;

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

class System {
  /* Represents the system of entities with newtonian physics */
  constructor(ents) {
    this.entities = ents; // array of entities in the system
    this.scale = 1100000; // real scale to canvas scale
    this.lastTime = performance.now(); // last time a physicsStep was taken
    this.dt = 1/60; // intial time step, changes over time
  }

  physicsStep(elapsed) {
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

      obj.locX += this.dt * obj.velX/(scale);
      obj.locY += this.dt * obj.velY/(scale);
    }

    this.dt = 128 * (elapsed - this.lastTime);
    this.lastTime = elapsed;
  }

   getEntities() {
    return this.entities;
  }
}

class Renderer {
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext('2d');
  }

  setRenderRoutine(renderFunc) {
    this.render = renderFunc;
  }

  getContext() {
    return this.ctx;
  }

  loopStep(dt) {
    window.requestAnimationFrame(loopStep);
    this.render();
  }
}

(function() {
  let earth = new Entity(5.972e24, 400, 400, 0.1, -12, 6371000);
  let moon = new Entity(7.347673e22, 400 - 384400000/scale, 400, 0, 1023.006, 1737000);

  let system = new System([earth, moon]);
  let renderer = new Renderer('canvas');
  let ctx = renderer.getContext();

  function drawSystem() {
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
  }

  renderer.setRenderRoutine(drawSystem);

  for (let i = 0; i < 10; i++) {
    drawSystem();
    system.physicsStep(1/6);
  }

})();

  // var debugTable = (function() {
  //   var radiusLabel = document.getElementById('radius-val'),
  //       forceLabel = document.getElementById('force-val'),
  //       moonSpeedLabel = document.getElementById('moon-speed-val');
  //
  //   return {
  //     setRadiusValue: function(r) {
  //       radiusLabel.innerHTML = r;
  //     },
  //     setForceValue: function(f) {
  //       forceLabel.innerHTML = f;
  //     },
  //     setMoonSpeedValue: function(ms) {
  //       moonSpeedLabel.innerHTML = ms;
  //     }
  //   };
  // }());

//   var physics = (function(things) {
//
//     var objects = things,
//         len = objects.length,
//         lastTime = performance.now(),
//         dt = 1/60;
//
//     return {
//       advance: function(elapsed) {
//         var xForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);
//         var yForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);
//
//         for (var i = 0; i < objects.length - 1; i++) {
//           for (var j = i + 1; j < objects.length; j++) {
//             var obj1 = objects[i],
//                 obj2 = objects[j];
//             var dx = (obj2.locX - obj1.locX) * scale,
//                 dy = (obj2.locY - obj1.locY) * scale;
//             var r2 = Math.pow(dx, 2) + Math.pow(dy, 2),
//                 r = Math.sqrt(r2),
//                 force = (G * obj1.mass * obj2.mass) / r2;
//
//             xForces[i] += force * dx/r;
//             xForces[j] -= force * dx/r;
//             yForces[i] += force * dy/r;
//             yForces[j] -= force * dy/r;
//
//             // Update debug info:
//             // debugTable.setRadiusValue(r.toFixed(2) + " m");
//             // debugTable.setForceValue(force + " N");
//             // debugTable.setMoonSpeedValue(Math.sqrt(Math.pow(objects[1].velX, 2) + Math.pow(objects[1].velY, 2)));
//           }
//         }
//
//         for (var i = 0; i < len; i++) {
//           var obj = objects[i];
//           xForces[i] /= obj.mass;
//           yForces[i] /= obj.mass;
//
//           obj.velX += dt * xForces[i];
//           obj.velY += dt * yForces[i];
//
//           obj.locX += dt * obj.velX/(scale);
//           obj.locY += dt * obj.velY/(scale);
//         }
//
//         dt = 128 * (elapsed - lastTime);
//         lastTime = elapsed;
//       }
//     };
//   }(bodies));
//
//   var renderer = (function(things) {
//     var objects = things;
//
//     function loopStep(dt) {
//       window.requestAnimationFrame(loopStep);
//       ctx.fillStyle = colBG;
//       ctx.fillRect(0, 0, canvasWidth, canvasHeight);
//       ctx.fillStyle = "black";
//
//       for (var i = 0; i < objects.length; i++) {
//         objects[i].draw();
//         physics.advance(dt);
//       }
//     }
//
//     return {
//       animate: function() {
//         window.requestAnimationFrame(loopStep);
//       }
//     };
//   }(bodies));
//
//   function Body(m, x, y, vx, vy, r, draw) {
//     this.mass = m; // real mass
//     this.locX = x; // canvas x coordinate
//     this.locY = y; // canvas y coordinate
//     this.velX = vx; // real x velocity (m/s)
//     this.velY = vy; // real y velocity (m/s)
//     this.radius = r / scale; // radius for canvas arcs
//
//     if (draw) {
//       this.draw = draw;
//     } else {
//       this.draw = function() {
//         ctx.beginPath();
//         ctx.arc(this.locX, this.locY, this.radius, 0, Math.PI);
//         ctx.fill();
//       };
//     }
//   }
//
//   renderer.animate();
// }());
