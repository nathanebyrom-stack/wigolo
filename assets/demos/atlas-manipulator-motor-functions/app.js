(function(){
  var wrap = document.getElementById('wrap');

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f5f2);
  scene.fog = new THREE.Fog(0xf6f5f2, 10, 24);

  var camera = new THREE.PerspectiveCamera(44, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(4.6, 3.9, 10.2);
  camera.lookAt(0, 2.1, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  // ---------- Lights ----------
  var hemi = new THREE.HemisphereLight(0xffffff, 0x9a968c, 0.7);
  scene.add(hemi);

  var key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(3.6, 6.4, 4.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.bias = -0.0015;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xff8a3d, 0.14);
  rim.position.set(-4, 2.4, -3.2);
  scene.add(rim);

  var fill = new THREE.AmbientLight(0xffffff, 0.32);
  scene.add(fill);

  // ---------- Ground ----------
  var groundMat = new THREE.MeshStandardMaterial({ color: 0xe2dfd8, roughness: 0.95, metalness: 0.02 });
  var ground = new THREE.Mesh(new THREE.CircleGeometry(10, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  var polarGrid = new THREE.PolarGridHelper(6.4, 16, 6, 64, 0xcac3b3, 0xdad5c9);
  polarGrid.position.y = 0.005;
  scene.add(polarGrid);

  function makeDashedRing(radius, color, opacity) {
    var pts = [];
    for (var i = 0; i <= 128; i++) {
      var a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineDashedMaterial({ color: color, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: opacity });
    var line = new THREE.LineLoop(geo, mat);
    line.computeLineDistances();
    line.position.y = 0.01;
    scene.add(line);
    return line;
  }
  makeDashedRing(3.2, 0xe3711f, 0.5);
  makeDashedRing(5.4, 0xb0a894, 0.4);

  // ---------- Materials ----------
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x110f0d, roughness: 0.55, metalness: 0.32 });
  var orangeMat = new THREE.MeshStandardMaterial({ color: 0x8a3012, roughness: 0.34, metalness: 0.55, emissive: 0x2a0f05, emissiveIntensity: 0.28 });
  var ringMat = new THREE.MeshStandardMaterial({ color: 0xb5491c, roughness: 0.16, metalness: 0.85, emissive: 0x3a1608, emissiveIntensity: 0.4 });
  var grayMat = new THREE.MeshStandardMaterial({ color: 0x46443e, roughness: 0.48, metalness: 0.42 });
  var silverMat = new THREE.MeshStandardMaterial({ color: 0x8f8b82, roughness: 0.26, metalness: 0.8 });
  var boltMat = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 0.4, metalness: 0.6 });

  function mesh(geo, mat, castShadow, receiveShadow) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = !!castShadow;
    m.receiveShadow = !!receiveShadow;
    return m;
  }

  // thin copper collar ring + a circle of small bolt heads, for mechanical greebling
  function addBoltCollar(parent, y, ringRadius, boltCount, boltRadius) {
    var collar = mesh(new THREE.TorusGeometry(ringRadius, ringRadius * 0.11, 10, 32), ringMat, true, true);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    parent.add(collar);

    for (var i = 0; i < boltCount; i++) {
      var a = (i / boltCount) * Math.PI * 2;
      var bolt = mesh(new THREE.CylinderGeometry(boltRadius, boltRadius, boltRadius * 1.1, 8), boltMat, true, true);
      bolt.position.set(Math.cos(a) * ringRadius, y, Math.sin(a) * ringRadius);
      bolt.rotation.x = Math.PI / 2;
      parent.add(bolt);
    }
    return collar;
  }

  // a coupling-ring collar sized to clamp around a square beam (not the ball joint itself) —
  // sits just past the sphere, on the tube, so it reads as a joint collar rather than a
  // slice through the ball as the parent pivot swings.
  function addBeamCollar(parent, y, beamHalfWidth, boltCount, boltRadius) {
    var tubeR = beamHalfWidth * 0.4;
    var ringRadius = beamHalfWidth * 1.42 + tubeR * 1.05;
    return addBoltCollar(parent, y, ringRadius, boltCount, boltRadius);
  }

  // ---------- Base (static) ----------
  var BASE_H = 0.95;
  var base = new THREE.Group();
  scene.add(base);

  var baseBody = mesh(new THREE.CylinderGeometry(0.6, 1.02, BASE_H, 40), bodyMat, true, true);
  baseBody.position.y = BASE_H / 2;
  base.add(baseBody);

  var baseRing = mesh(new THREE.TorusGeometry(0.86, 0.085, 16, 48), ringMat, true, true);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.32;
  base.add(baseRing);

  var baseCap = mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 40), silverMat, true, true);
  baseCap.position.y = BASE_H + 0.02;
  base.add(baseCap);

  // ---------- Kinematic chain ----------
  var L1 = 2.15; // upper arm length (base)
  var L2 = 1.85; // forearm length (base)
  var L3 = 0.5;  // wrist stub length
  var ARM_W = 0.44, FORE_W = 0.34;

  var column = new THREE.Group();
  column.position.y = BASE_H;
  scene.add(column);

  var shoulderPivot = new THREE.Group();
  column.add(shoulderPivot);

  var shoulderSphere = mesh(new THREE.SphereGeometry(0.56, 32, 24), orangeMat, true, true);
  shoulderPivot.add(shoulderSphere);
  addBeamCollar(shoulderPivot, 0.58, ARM_W / 2, 12, 0.04);

  var upperArm = mesh(new THREE.BoxGeometry(ARM_W, L1, ARM_W), bodyMat, true, true);
  upperArm.position.y = L1 / 2;
  shoulderPivot.add(upperArm);

  var elbowPivot = new THREE.Group();
  elbowPivot.position.y = L1;
  shoulderPivot.add(elbowPivot);

  var elbowSphere = mesh(new THREE.SphereGeometry(0.42, 32, 24), grayMat, true, true);
  elbowPivot.add(elbowSphere);
  addBeamCollar(elbowPivot, 0.44, FORE_W / 2, 10, 0.032);

  var forearm = mesh(new THREE.BoxGeometry(FORE_W, L2, FORE_W), bodyMat, true, true);
  forearm.position.y = L2 / 2;
  elbowPivot.add(forearm);

  var wristPivot = new THREE.Group();
  wristPivot.position.y = L2;
  elbowPivot.add(wristPivot);

  var wristStub = mesh(new THREE.BoxGeometry(0.26, L3, 0.26), bodyMat, true, true);
  wristStub.position.y = L3 / 2;
  wristPivot.add(wristStub);

  var wristBand = mesh(new THREE.TorusGeometry(0.2, 0.055, 12, 32), ringMat, true, true);
  wristBand.rotation.x = Math.PI / 2;
  wristBand.position.y = L3 * 0.62;
  wristPivot.add(wristBand);

  var mount = mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), bodyMat, true, true);
  mount.position.y = L3 + 0.09;
  wristPivot.add(mount);

  var FIN_LEN = 0.3, TIP_LEN = 0.18;
  function makeFinger(sign) {
    var p = new THREE.Group();
    p.position.set(sign * 0.12, L3 + 0.18, 0);
    var knuckle = mesh(new THREE.SphereGeometry(0.06, 12, 10), grayMat, true, true);
    p.add(knuckle);
    var f = mesh(new THREE.BoxGeometry(0.09, FIN_LEN, 0.16), silverMat, true, true);
    f.position.y = FIN_LEN / 2;
    p.add(f);
    var tip = mesh(new THREE.BoxGeometry(0.075, TIP_LEN, 0.13), ringMat, true, true);
    tip.position.y = FIN_LEN + TIP_LEN / 2;
    p.add(tip);
    wristPivot.add(p);
    return p;
  }
  var fingerL = makeFinger(-1);
  var fingerR = makeFinger(1);

  // ---------- Segment length control ----------
  function setSegmentLength(scale) {
    var l1c = L1 * scale, l2c = L2 * scale;

    upperArm.geometry.dispose();
    upperArm.geometry = new THREE.BoxGeometry(ARM_W, l1c, ARM_W);
    upperArm.position.y = l1c / 2;
    elbowPivot.position.y = l1c;

    forearm.geometry.dispose();
    forearm.geometry = new THREE.BoxGeometry(FORE_W, l2c, FORE_W);
    forearm.position.y = l2c / 2;
    wristPivot.position.y = l2c;
  }

  // ---------- Resize ----------
  function onResize() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // ---------- Interactive state ----------
  function deg(d) { return d * Math.PI / 180; }
  function wave(t, period, min, max, phase) {
    var mid = (min + max) / 2, amp = (max - min) / 2;
    return mid + amp * Math.sin((t / period) * Math.PI * 2 + (phase || 0));
  }

  var locks = { shoulder: false, elbow: false, wrist: false };
  var angles = { shoulder: deg(22), elbow: deg(-32), wrist: 0 };
  var held = { shoulder: 0, elbow: 0, wrist: 0 };
  var targetBaseYaw = 0;
  var clawOpen = false;
  var clawAngle = deg(3);
  var speedMult = 1;

  var PRESETS = {
    reach: { shoulder: deg(8), elbow: deg(-52), wrist: deg(0), claw: true },
    lift: { shoulder: deg(56), elbow: deg(-16), wrist: deg(0), claw: false },
    place: { shoulder: deg(30), elbow: deg(-36), wrist: deg(12), claw: true }
  };

  var clock = new THREE.Clock();
  var simTime = 0;

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    simTime += dt * speedMult;
    var t = simTime;
    var lerpMult = speedMult;

    // base: manual swivel, eased toward slider target
    column.rotation.y += (targetBaseYaw - column.rotation.y) * Math.min(0.12 * lerpMult, 0.9);

    // shoulder / elbow / wrist: auto-cycle unless locked (locked = hold at `held` target)
    var shoulderTarget = locks.shoulder ? held.shoulder : wave(t, 6.0, deg(-16), deg(60), 0.3);
    angles.shoulder += (shoulderTarget - angles.shoulder) * Math.min(0.05 * lerpMult, 0.9);
    shoulderPivot.rotation.z = angles.shoulder;

    var elbowTarget = locks.elbow ? held.elbow : wave(t, 5.0, deg(-58), deg(-6), 1.1);
    angles.elbow += (elbowTarget - angles.elbow) * Math.min(0.05 * lerpMult, 0.9);
    elbowPivot.rotation.z = angles.elbow;

    var wristTarget = locks.wrist ? held.wrist : wave(t, 3.0, deg(-22), deg(22), 1.9);
    angles.wrist += (wristTarget - angles.wrist) * Math.min(0.06 * lerpMult, 0.9);
    wristPivot.rotation.z = angles.wrist;

    // claw: manual toggle, slow ease both ways
    var clawTarget = clawOpen ? deg(22) : deg(3);
    clawAngle += (clawTarget - clawAngle) * Math.min(0.012 * lerpMult, 0.9);
    fingerL.rotation.z = clawAngle;
    fingerR.rotation.z = -clawAngle;

    updateTelemetry();
    renderer.render(scene, camera);
  }
  animate();

  // ---------- Controls wiring ----------
  var lengthInput = document.getElementById('ctl-length');
  var lengthVal = document.getElementById('val-length');
  lengthInput.addEventListener('input', function () {
    var pct = parseInt(lengthInput.value, 10);
    lengthVal.textContent = pct + '%';
    setSegmentLength(pct / 100);
  });

  var swivelInput = document.getElementById('ctl-swivel');
  var swivelVal = document.getElementById('val-swivel');
  swivelInput.addEventListener('input', function () {
    var d = parseInt(swivelInput.value, 10);
    swivelVal.textContent = d + '°';
    targetBaseYaw = deg(d);
  });

  var lockBtns = { shoulder: null, elbow: null, wrist: null };
  ['shoulder', 'elbow', 'wrist'].forEach(function (joint) {
    var btn = document.getElementById('lock-' + joint);
    var baseLabel = btn.textContent;
    lockBtns[joint] = { el: btn, label: baseLabel };
    btn.addEventListener('click', function () {
      locks[joint] = !locks[joint];
      if (locks[joint]) held[joint] = angles[joint];
      btn.classList.toggle('locked', locks[joint]);
      btn.textContent = (locks[joint] ? '\u{1F512} ' : '') + baseLabel;
      setActivePreset(null);
    });
  });

  var presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset-card'));
  function setActivePreset(name) {
    presetBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.preset === name); });
  }
  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = PRESETS[btn.dataset.preset];
      if (!p) return;
      ['shoulder', 'elbow', 'wrist'].forEach(function (joint) {
        locks[joint] = true;
        held[joint] = p[joint];
        var lb = lockBtns[joint];
        lb.el.classList.add('locked');
        lb.el.textContent = '\u{1F512} ' + lb.label;
      });
      clawOpen = p.claw;
      clawBtn.classList.toggle('open', clawOpen);
      clawBtn.textContent = clawOpen ? 'Close claw' : 'Open claw';
      setActivePreset(btn.dataset.preset);
    });
  });

  var telBase = document.getElementById('tel-base');
  var telReach = document.getElementById('tel-reach');
  function updateTelemetry() {
    if (!telBase) return;
    var deg2 = Math.round(column.rotation.y * 180 / Math.PI);
    telBase.textContent = (deg2 >= 0 ? '+' : '') + deg2 + '°';
    telReach.textContent = lengthVal.textContent;
  }

  var clawBtn = document.getElementById('ctl-claw');
  clawBtn.addEventListener('click', function () {
    clawOpen = !clawOpen;
    clawBtn.classList.toggle('open', clawOpen);
    clawBtn.textContent = clawOpen ? 'Close claw' : 'Open claw';
  });

  var speedBtns = Array.prototype.slice.call(document.querySelectorAll('.speed-btn'));
  speedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      speedMult = parseFloat(btn.dataset.speed);
      speedBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
    });
  });

  var panelEl = document.getElementById('panel');
  var minBtn = document.getElementById('panel-min');
  minBtn.addEventListener('click', function () {
    var collapsed = panelEl.classList.toggle('collapsed');
    minBtn.innerHTML = collapsed ? '&#43;' : '&#8722;';
    minBtn.title = collapsed ? 'Expand' : 'Minimise';
    minBtn.setAttribute('aria-label', collapsed ? 'Expand controls' : 'Minimise controls');
  });
})();
