(function(){
  var wrap = document.getElementById('wrap');

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0a08);
  scene.fog = new THREE.Fog(0x0c0a08, 7, 20);

  var camera = new THREE.PerspectiveCamera(44, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(4.6, 3.9, 10.2);
  camera.lookAt(0, 2.1, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  // ---------- Lights ----------
  var hemi = new THREE.HemisphereLight(0x3a2f22, 0x020201, 0.28);
  scene.add(hemi);

  var key = new THREE.DirectionalLight(0xfdeacc, 0.85);
  key.position.set(3.6, 6.2, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.bias = -0.0015;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xff8a3d, 0.3);
  rim.position.set(-4, 2.4, -3.2);
  scene.add(rim);

  var fill = new THREE.AmbientLight(0x140f0a, 0.15);
  scene.add(fill);

  // ---------- Ground ----------
  var groundMat = new THREE.MeshStandardMaterial({ color: 0x0d0a07, roughness: 0.95, metalness: 0.04 });
  var ground = new THREE.Mesh(new THREE.CircleGeometry(10, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- Materials ----------
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x18140f, roughness: 0.55, metalness: 0.4 });
  var orangeMat = new THREE.MeshStandardMaterial({ color: 0x8a3012, roughness: 0.34, metalness: 0.55, emissive: 0x2a0f05, emissiveIntensity: 0.35 });
  var ringMat = new THREE.MeshStandardMaterial({ color: 0xb5491c, roughness: 0.16, metalness: 0.85, emissive: 0x3a1608, emissiveIntensity: 0.55 });
  var grayMat = new THREE.MeshStandardMaterial({ color: 0x46443e, roughness: 0.48, metalness: 0.42 });
  var silverMat = new THREE.MeshStandardMaterial({ color: 0x8f8b82, roughness: 0.26, metalness: 0.8 });

  function mesh(geo, mat, castShadow, receiveShadow) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = !!castShadow;
    m.receiveShadow = !!receiveShadow;
    return m;
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
  var L1 = 2.15; // upper arm length
  var L2 = 1.85; // forearm length
  var L3 = 0.5;  // wrist stub length

  var column = new THREE.Group();
  column.position.y = BASE_H;
  scene.add(column);

  var shoulderPivot = new THREE.Group();
  column.add(shoulderPivot);

  var shoulderSphere = mesh(new THREE.SphereGeometry(0.56, 32, 24), orangeMat, true, true);
  shoulderPivot.add(shoulderSphere);

  var upperArm = mesh(new THREE.BoxGeometry(0.44, L1, 0.44), bodyMat, true, true);
  upperArm.position.y = L1 / 2;
  shoulderPivot.add(upperArm);

  var elbowPivot = new THREE.Group();
  elbowPivot.position.y = L1;
  shoulderPivot.add(elbowPivot);

  var elbowSphere = mesh(new THREE.SphereGeometry(0.42, 32, 24), grayMat, true, true);
  elbowPivot.add(elbowSphere);

  var forearm = mesh(new THREE.BoxGeometry(0.34, L2, 0.34), bodyMat, true, true);
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

  var FIN_LEN = 0.46;
  function makeFinger(sign) {
    var p = new THREE.Group();
    p.position.set(sign * 0.12, L3 + 0.18, 0);
    var f = mesh(new THREE.BoxGeometry(0.09, FIN_LEN, 0.16), silverMat, true, true);
    f.position.y = FIN_LEN / 2;
    p.add(f);
    wristPivot.add(p);
    return p;
  }
  var fingerL = makeFinger(-1);
  var fingerR = makeFinger(1);

  // ---------- Resize ----------
  function onResize() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // ---------- Animation cycle (autonomous, matches reference demo) ----------
  function deg(d) { return d * Math.PI / 180; }
  function wave(t, period, min, max, phase) {
    var mid = (min + max) / 2, amp = (max - min) / 2;
    return mid + amp * Math.sin((t / period) * Math.PI * 2 + (phase || 0));
  }

  var clock = new THREE.Clock();

  var tags = {
    base: document.getElementById('tag-base'),
    shoulder: document.getElementById('tag-shoulder'),
    elbow: document.getElementById('tag-elbow'),
    wrist: document.getElementById('tag-wrist'),
    gripper: document.getElementById('tag-gripper')
  };
  var tagOrder = ['base', 'shoulder', 'elbow', 'wrist', 'gripper'];
  var activeIdx = 0;
  setInterval(function () {
    tagOrder.forEach(function (k) { tags[k].classList.remove('active'); });
    tags[tagOrder[activeIdx % tagOrder.length]].classList.add('active');
    activeIdx++;
  }, 1500);
  tags[tagOrder[0]].classList.add('active');

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    column.rotation.y = wave(t, 9.0, deg(-11), deg(11), 0);
    shoulderPivot.rotation.z = wave(t, 6.0, deg(-16), deg(60), 0.3);
    elbowPivot.rotation.z = wave(t, 5.0, deg(-58), deg(-6), 1.1);
    wristPivot.rotation.z = wave(t, 3.0, deg(-22), deg(22), 1.9);

    var grip = wave(t, 2.4, deg(3), deg(20), 2.6);
    fingerL.rotation.z = grip;
    fingerR.rotation.z = -grip;

    renderer.render(scene, camera);
  }
  animate();
})();
