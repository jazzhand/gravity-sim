var ctx = document.getElementById('canvas').getContext("2d");
var bodies = [];
var running;

var radiusLabel = document.getElementById('radius-val');
var forceLabel = document.getElementById('force-val');
var moonSpeedLabel = document.getElementById('moon-speed-val')

const G = 6.674e-11;
const scale = 1200000;

function loopStep(now) {
  // If the simulation has
  if (running) {
    window.requestAnimationFrame(loopStep);
  }

  // ctx.globalCompositionOperation = 'destination-over';
  ctx.clearRect(0, 0, 800, 800);


  for (var i = 0; i < bodies.length; i++) {
    var bod = bodies[i];

    // Draw all the things
    ctx.beginPath();
    ctx.arc(bod.locX, bod.locY, bod.radius, 0, 2*Math.PI);
    ctx.fill();

    calculateForces(now);
    bod.locX += bod.velX/now;
    bod.locY += bod.velY/now;
  }
}

function Body(m, x, y, vx, vy, r) {
  this.mass = m;
  this.locX = x;
  this.locY = y;
  this.velX = vx;
  this.velY = vy;
  this.radius = r/scale;
}

function distanceBetween(bod1, bod2) {
  dx = (bod1.locX - bod2.locX) * scale;
  dy = (bod2.locY - bod2.locY) * scale;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function forceBetween(bod1, bod2, r) {
  return (G * bod1.mass * bod2.mass) / Math.pow(r, 2);
}

function calculateForces(dt) {
  var len = bodies.length;
  var xForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);
  var yForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);

  for (var i = 0; i < bodies.length - 1; i++) {
    for (var j = i + 1; j < bodies.length; j++) {
      var r = distanceBetween(bodies[i], bodies[j]);
      var force = forceBetween(bodies[i], bodies[j], r);
      var dx = (bodies[j].locX - bodies[i].locX) * scale;
      var dy = (bodies[j].locY - bodies[i].locY) * scale;

      xForces[i] += force * dx/r;
      xForces[j] -= force * dx/r;
      yForces[i] += force * dy/r;
      yForces[j] -= force * dy/r;

      // Update debug info:
      radiusLabel.innerHTML = r.toFixed(2) + " m";
      forceLabel.innerHTML = force + " N";
      moonSpeedLabel.innerHTML = Math.sqrt(Math.pow(bodies[1].velX, 2) + Math.pow(bodies[1].velY, 2));
    }
  }

  for (var i = 0; i < len; i++) {
    var b = bodies[i];
    xForces[i] /= b.mass;
    yForces[i] /= b.mass;

    b.velX += dt * xForces[i];
    b.velY += dt * yForces[i];
  }

  // console.log(xForces);
  // console.log(yForces);
}

function init() {
  // earth to moon: 384400
  // earth to sun: 149.6e6
  var earth = new Body(5.972e24, 400, 400, 0, 0, 6371000);
  var moon = new Body(7.347673e22, 400 - 384400000/scale, 400, 0, 1023.006, 1737000);

  bodies.push(earth);
  bodies.push(moon);

  running = true;
}

init();
// calculateForces(1/60);
window.requestAnimationFrame(loopStep);
