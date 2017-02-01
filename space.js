// Main module
(function() {
  // Some constants
  const scale = 1100000; // real scale to canvas scale
  const colBG = "rgba(20, 20, 20, 0.5)";
  const colEarth = "#39f";
  const colMoon = "#f82";
  const canvasWidth = 800;
  const canvasHeight = 800;

  var ctx = document.getElementById('canvas').getContext("2d");

  var bodies = [
    new Body(5.972e24, 400, 400, 0.1, -12, 6371000, function() {
      ctx.beginPath();
      ctx.fillStyle = colEarth;
      ctx.arc(this.locX, this.locY, this.radius, 0, 2 * Math.PI);
      ctx.fill();
    }),

    new Body(7.347673e22, 400 - 384400000/scale, 400, 0, 1023.006, 1737000,
      function() {
        ctx.beginPath();
        ctx.fillStyle = colMoon;
        ctx.arc(this.locX, this.locY, this.radius, 0, 2*Math.PI);
        ctx.fill();
      })
  ];

  var debugTable = (function() {
    var radiusLabel = document.getElementById('radius-val'),
        forceLabel = document.getElementById('force-val'),
        moonSpeedLabel = document.getElementById('moon-speed-val');

    return {
      setRadiusValue: function(r) {
        radiusLabel.innerHTML = r;
      },
      setForceValue: function(f) {
        forceLabel.innerHTML = f;
      },
      setMoonSpeedValue: function(ms) {
        moonSpeedLabel.innerHTML = ms;
      }
    };
  }());

  var physics = (function(things) {
    const G = 6.674e-11; // Gravitational constant
    var objects = things,
        len = objects.length,
        lastTime = performance.now(),
        dt = 1/60;

    return {
      advance: function(elapsed) {
        var xForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);
        var yForces = Array.apply(null, Array(len)).map(Number.prototype.valueOf, 0);

        for (var i = 0; i < objects.length - 1; i++) {
          for (var j = i + 1; j < objects.length; j++) {
            var obj1 = objects[i],
                obj2 = objects[j];
            var dx = (obj2.locX - obj1.locX) * scale,
                dy = (obj2.locY - obj1.locY) * scale;
            var r2 = Math.pow(dx, 2) + Math.pow(dy, 2),
                r = Math.sqrt(r2),
                force = (G * obj1.mass * obj2.mass) / r2;

            xForces[i] += force * dx/r;
            xForces[j] -= force * dx/r;
            yForces[i] += force * dy/r;
            yForces[j] -= force * dy/r;

            // Update debug info:
            // debugTable.setRadiusValue(r.toFixed(2) + " m");
            // debugTable.setForceValue(force + " N");
            // debugTable.setMoonSpeedValue(Math.sqrt(Math.pow(objects[1].velX, 2) + Math.pow(objects[1].velY, 2)));
          }
        }

        for (var i = 0; i < len; i++) {
          var obj = objects[i];
          xForces[i] /= obj.mass;
          yForces[i] /= obj.mass;

          obj.velX += dt * xForces[i];
          obj.velY += dt * yForces[i];

          obj.locX += dt * obj.velX/(scale);
          obj.locY += dt * obj.velY/(scale);
        }

        dt = 128 * (elapsed - lastTime);
        lastTime = elapsed;
      }
    };
  }(bodies));

  var renderer = (function(things) {
    var objects = things;

    function loopStep(dt) {
      window.requestAnimationFrame(loopStep);
      ctx.fillStyle = colBG;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "black";

      for (var i = 0; i < objects.length; i++) {
        objects[i].draw();
        physics.advance(dt);
      }
    }

    return {
      animate: function() {
        window.requestAnimationFrame(loopStep);
      }
    };
  }(bodies));

  function Body(m, x, y, vx, vy, r, draw) {
    this.mass = m; // real mass
    this.locX = x; // canvas x coordinate
    this.locY = y; // canvas y coordinate
    this.velX = vx; // real x velocity (m/s)
    this.velY = vy; // real y velocity (m/s)
    this.radius = r / scale; // radius for canvas arcs

    if (draw) {
      this.draw = draw;
    } else {
      this.draw = function() {
        ctx.beginPath();
        ctx.arc(this.locX, this.locY, this.radius, 0, Math.PI);
        ctx.fill();
      };
    }
  }

  renderer.animate();
}());
