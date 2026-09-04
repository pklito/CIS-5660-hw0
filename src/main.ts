import {vec3, vec4} from 'gl-matrix';
import Stats from 'stats-js';
import GUI from 'lil-gui';
import Icosphere from './geometry/Icosphere';
import Cube from './geometry/Cube';
import Square from './geometry/Square';

import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import lambertVertSource from './shaders/lambert-vert.glsl?raw';
import lambertFragSource from './shaders/lambert-frag.glsl?raw';
import Drawable from './rendering/gl/Drawable';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
enum Objects{
  SQUARE,
  CUBE,
  SPHERE
}

const controls = {
  tesselations: 5,
  object : Objects.CUBE,
  'Load Scene': loadScene, // A function pointer, essentially
  color : vec4.fromValues(1.0, 0, 0, 1.0)
};

let icosphere: Icosphere;
let cube: Cube;
let square : Square;
let prevTesselations: number = 5;
let prevColor : vec4 = vec4.fromValues(0.0, 0, 0, 1.0);
let prevObject : Objects = Objects.CUBE;

function enumToObject(e : Objects){
  switch(e){
    case Objects.CUBE:
      return cube;
    case Objects.SQUARE:
      return square;
    case Objects.SPHERE:
      return icosphere;
  }
}

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  prevColor = null;
  prevObject = null;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'object', {Square : Objects.SQUARE, Cube : Objects.CUBE, Sphere: Objects.SPHERE});
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'color').listen();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  //backface culling
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    if(controls.object !== prevObject){
      if(enumToObject(controls.object).color == null){
        enumToObject(controls.object).color = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
      }
      controls.color = enumToObject(controls.object).color;
      prevObject = controls.object;

    }

    if(prevColor == null || !vec4.equals(controls.color, prevColor)){
      enumToObject(controls.object).color = controls.color;
      prevColor = controls.color;
    }

    renderer.render(camera, lambert, [enumToObject(controls.object)]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
