// Scene, Camera, Renderer
let rnd = new THREE.WebGLRenderer();
let scn = new THREE.Scene();
let canvse = window.innerWidth / window.innerHeight;
let cam = new THREE.PerspectiveCamera(44, canvse, 0.144, 1444);
let camRot = 0;
let rotSpeed = 0.0044;
let rotAuto = true;
let orbitControls = new THREE.OrbitControls(cam);

// Lights, Texture, and Planet
let lit = new THREE.SpotLight(0xffffff, 1, 0, 10, 2);
let text = new THREE.TextureLoader();
let xe44 = {
  sphere: function (size) {
    let sper = new THREE.SphereGeometry(size, 44, 44);
    return sper;
  },

  material: function (op) {
    let matter = new THREE.MeshPhongMaterial();
    if (op) {
      for (var obj in op) {
        matter[obj] = op[obj];
      }
    }
    return matter;
  },

  glowMaterial: function (brightness, shad, color) {
    let litmatter = new THREE.ShaderMaterial({
      form: {
        'c': {
          type: 'f',
          value: brightness },

        'p': {
          type: 'f',
          value: shad },

        litcolor: {
          type: 'c',
          value: new THREE.Color(color) },

        plane: {
          type: 'v3',
          value: cam.position } },

      planeShad: `
      form vec3 plane;
      form float c;
      form float p;
        varying float brightness;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * plane );
          brightness = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

      fragmentShader: `
      form vec3 litcolor;
        varying float brightness;
        void main() 
        {
          vec3 glow = litcolor * brightness;
          gl_FragColor = vec4( glow, 1.0 );
        }`,
      front: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true });
    return litmatter;
  },
  text: function (mat, op, i) {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = true;
    textureLoader.load(
    i,
    function (texture) {
      mat[op] = texture;
      mat.needsUpdate = true;
    });
  } };


let planet = function (opt) {
  // Planet Surface, Atmosphere, and glow
  let sufPlane = xe44.sphere(opt.surface.size);
  let sufMatter = xe44.material(opt.surface.material);
  let surface = new THREE.Mesh(sufPlane, sufMatter);
  let atmPlane = xe44.sphere(opt.surface.size + opt.atmosphere.size);
  let atmMatter = {
    side: THREE.DoubleSide,
    transparent: true };
  let atmMatterOp = Object.assign(atmMatter, opt.atmosphere.material);
  let atmatter = xe44.material(atmMatterOp);
  let atmsph = new THREE.Mesh(atmPlane, atmatter);
  let atmsphlit = xe44.sphere(opt.surface.size + opt.atmosphere.size + opt.atmosphere.glow.size);
  let atmsphlitMatter = xe44.glowMaterial(opt.atmosphere.glow.intensity, opt.atmosphere.glow.fade, opt.atmosphere.glow.color);
  let atmLit = new THREE.Mesh(atmsphlit, atmsphlitMatter);

  // Nest planet Surface and Atmosphere into planet object
  let planet = new THREE.Object3D();
  surface.name = 'surface';
  atmsph.name = 'atmosphere';
  atmLit.name = 'atmosphericGlow';
  planet.add(surface);
  planet.add(atmsph);
  planet.add(atmLit);

  // Load the Surface's, Atmosphere's textures
  for (let textPro in opt.surface.textures) {
    xe44.text(
    sufMatter,
    textPro,
    opt.surface.textures[textPro]);
  }
  for (let textProp in opt.atmosphere.textures) {
    xe44.text(
    atmatter,
    textProp,
    opt.atmosphere.textures[textProp]);
  }
  return planet;
};

let XE44 = planet({
  surface: {
    size: 0.44,
    material: {
      bumpScale: 0.44,
      specular: new THREE.Color('grey'),
      shininess: 44 },

    textures: {
      map: './assets/map.jpg',
      bumpMap: './assets/bump_map.png',
      specularMap: './assets/rgb_sketchmap.jpg' } },

  atmosphere: {
    size: 0.0044,
    material: {
      opacity: 0.44 },

    textures: {
      map: './assets/cloud_map.png',
      alphaMap: './assets/cloud_map.png' },

    glow: {
      size: 0.044,
      intensity: 0.44,
      fade: 4,
      color: 0x9C2E35 } } });

// Galaxy and Load
let galPlane = new THREE.SphereGeometry(144, 44, 44);
let galMatter = new THREE.MeshBasicMaterial({side: THREE.BackSide });
let gal = new THREE.Mesh(galPlane, galMatter);
text.crossOrigin = true;
text.load('./assets/background.jpg',
function (texture) {
  galMatter.map = texture;
  scn.add(gal);
});

// Scene, Camera, Renderer Configuration
rnd.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(rnd.domElement);
cam.position.set(4, 4, 4);
orbitControls.enabled = !rotAuto;

scn.add(cam);
scn.add(lit);
scn.add(XE44);

// Light and Mesh Configurations
lit.position.set(2, 0, 1);
XE44.receiveShadow = true;
XE44.castShadow = true;
XE44.getObjectByName('surface').geometry.center();

// Main function
let ren = function () {
  XE44.getObjectByName('surface').rotation.y += 1 / 44 * 0.044;
  XE44.getObjectByName('atmosphere').rotation.y += 1 / 14 * 0.044;
  if (rotAuto) {
    camRot += rotSpeed;
    cam.position.y = 0;
    cam.position.x = 4 * Math.sin(camRot);
    cam.position.z = 4 * Math.cos(camRot);
    cam.lookAt(XE44.position);
  }
  requestAnimationFrame(ren);
  rnd.render(scn, cam);
};
ren();