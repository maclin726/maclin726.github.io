(function () {
  function X(w1) { return 20 + (w1 + 0.06) * 471.7; }
  function Y(w2) { return 254 - (w2 / 0.78) * 234; }

  var newtonPts = [
    [0.95, 0.05], [0.5, 0.25], [0.2, 0.42],
    [0.1, 0.52], [0.05, 0.58], [0.02, 0.61]
  ].map(function (p) { return [X(p[0]), Y(p[1])]; });

  var cdPts = [
    [0.95, 0.05], [0.4, 0.05], [0.4, 0.45],
    [0.08, 0.45], [0.08, 0.58], [0.0, 0.58], [0.0, 0.62]
  ].map(function (p) { return [X(p[0]), Y(p[1])]; });

  function catmullRomPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1] + ' ';
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i === 0 ? 0 : i - 1];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1] + ' ';
    }
    return d;
  }

  function linePath(pts) {
    return pts.reduce(function (d, p, i) {
      return d + (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1] + ' ';
    }, '');
  }

  var newtonD = catmullRomPath(newtonPts);
  var cdD = linePath(cdPts);

  var trailNewton = document.getElementById('fds-trailNewton');
  var trailCd = document.getElementById('fds-trailCd');
  trailNewton.setAttribute('d', newtonD);
  trailCd.setAttribute('d', cdD);

  var dotNewton = document.getElementById('fds-dotNewton');
  var dotCd = document.getElementById('fds-dotCd');
  var pulseRing = document.getElementById('fds-pulseRing');

  var lenNewton = trailNewton.getTotalLength();

  var cdCum = [0];
  for (var i = 0; i < cdPts.length - 1; i++) {
    var dx = cdPts[i + 1][0] - cdPts[i][0];
    var dy = cdPts[i + 1][1] - cdPts[i][1];
    cdCum.push(cdCum[cdCum.length - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  var cdTotal = cdCum[cdCum.length - 1];
  var zeroFraction = cdCum[5] / cdTotal;

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var raf = null, timeoutId = null, pulsed = false;

  function resetVisual() {
    trailNewton.style.strokeDasharray = lenNewton;
    trailNewton.style.strokeDashoffset = lenNewton;
    trailCd.style.strokeDasharray = cdTotal;
    trailCd.style.strokeDashoffset = cdTotal;
    var p0 = newtonPts[0];
    dotNewton.setAttribute('cx', p0[0]);
    dotNewton.setAttribute('cy', p0[1]);
    dotCd.setAttribute('cx', p0[0]);
    dotCd.setAttribute('cy', p0[1]);
    pulseRing.style.opacity = 0;
    pulseRing.classList.remove('go');
    pulsed = false;
  }

  function runCycle() {
    var duration = 3400;
    var holdTime = 1700;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var e = ease(t);

      trailNewton.style.strokeDashoffset = lenNewton * (1 - e);
      var ptN = trailNewton.getPointAtLength(lenNewton * e);
      dotNewton.setAttribute('cx', ptN.x);
      dotNewton.setAttribute('cy', ptN.y);

      trailCd.style.strokeDashoffset = cdTotal * (1 - e);
      var ptC = trailCd.getPointAtLength(cdTotal * e);
      dotCd.setAttribute('cx', ptC.x);
      dotCd.setAttribute('cy', ptC.y);

      if (!pulsed && e >= zeroFraction) {
        pulsed = true;
        pulseRing.setAttribute('cx', 48);
        pulseRing.setAttribute('cy', ptC.y);
        pulseRing.classList.add('go');
      }

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        timeoutId = setTimeout(function () {
          resetVisual();
          timeoutId = setTimeout(runCycle, 260);
        }, holdTime);
      }
    }
    raf = requestAnimationFrame(step);
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resetVisual();
  if (reduceMotion) {
    trailNewton.style.strokeDashoffset = 0;
    dotNewton.setAttribute('cx', newtonPts[newtonPts.length - 1][0]);
    dotNewton.setAttribute('cy', newtonPts[newtonPts.length - 1][1]);
    trailCd.style.strokeDashoffset = 0;
    dotCd.setAttribute('cx', cdPts[cdPts.length - 1][0]);
    dotCd.setAttribute('cy', cdPts[cdPts.length - 1][1]);
  } else {
    runCycle();
  }
})();
