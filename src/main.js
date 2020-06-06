import { mat4, vec3 } from 'gl-matrix';
import * as dat from 'dat.gui';

import './styles.css';

import gitHash from '../logfile.txt';
import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';


/* Animation class */
class ClassAnimation {
  constructor(canvas) {
   
    this.gl;
    this.canvas = canvas;
    this.timeMs = Date.now();
    this.startTime = Date.now();

    this.isMousePressed;
    this.currentlyPressedKeys = {};
  }

  initGL () {
    try {
      this.gl = this.canvas.getContext('webgl2');
      this.gl.viewportWidth = this.canvas.width;
      this.gl.viewportHeight = this.canvas.height;
    } catch (e) {
    }
    if (!this.gl) {
      alert('Could not initialize WebGL');
    }
  }

  getShader (type, str) {
    let shader;
    shader = this.gl.createShader(type);
    
    this.gl.shaderSource(shader, str);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      alert(this.gl.getShaderInfoLog(shader));
      return null;
    }
    
    return shader;
  }

  /* Listeners methods */

  handleMouseWeel(event) {
      console.log("git rev-parse HEAD");
  }

  handleMouseMove(event) {
  }

  handleMouseUp(event) {
    Mandelbrot.isMousePressed = false;
  }

  handleMouseDown(event) {
    Mandelbrot.isMousePressed = true;
  }

  handleKeyDown(event) {
    Mandelbrot.currentlyPressedKeys[event.keyCode] = true;
  }

  handleKeyUp(event) {
    Mandelbrot.currentlyPressedKeys[event.keyCode] = false;
  }

  handleKeys() {
  }

}

/* Mandelbrot class */
class ClassMandelbrot extends ClassAnimation {
  constructor(canvas, numberSegment, complexNumber) {
    super(canvas);

    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    this.numOfTextures = 0;
    this.textures = [];
    this.images = [];

    this.squareVertexBuffer;
    this.shaderProgram;

    this.timeSpeed = 1.0;

    /* Creation vectors */
    this.numberSegment = vec3.create(),
    this.complexNumber = vec3.create(),
    this.cursorPos = vec3.create();
    this.oldCursorPos = vec3.create();
    this.slide = vec3.create();
    
    /* Fill vectors */
    vec3.set(this.slide, ...[0.0, 0.0, 0.0]);
    vec3.set(this.cursorPos, ...[0.0, 0.0, 0.0]);
    vec3.set(this.oldCursorPos, ...[0.0, 0.0, 0.0]);
    vec3.set(this.numberSegment, ...numberSegment);
    vec3.set(this.complexNumber, ...complexNumber);
  } /* End of 'constructor' */
 
  /* Methods */

  /* Initialization of buffers */
  initBuffers () {
    this.squareVertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
    let vertices = [
      1.0, 1.0, 0.0,       0.0, 0.0, 1.0,
      -1.0, 1.0, 0.0,      1.0, 0.0, 0.0,  
      1.0, -1.0, 0.0,      0.0, 1.0, 1.0,
      -1.0, -1.0, 0.0,     1.0, 1.0, 0.0      
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
  }; /* End of 'initBuffers' method */

  /* Initialization of shaders */
  initShaders () {
    let fragmentShader = this.getShader(this.gl.FRAGMENT_SHADER, fsShaderStr);
    let vertexShader = this.getShader(this.gl.VERTEX_SHADER, vxShaderStr);

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      alert('Could not initialize shaders');
    }

    this.gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

    this.shaderProgram.vertexTexCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexTexCoord');
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexTexCoordAttribute);

    this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
    this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
    this.shaderProgram.uTime = this.gl.getUniformLocation(this.shaderProgram, 'uTime');
    
    this.shaderProgram.uMandNumberSegment = this.gl.getUniformLocation(this.shaderProgram, 'uMandNumberSegment');

    this.shaderProgram.uMandSlide = this.gl.getUniformLocation(this.shaderProgram, 'uMandSlide');
    
    this.shaderProgram.uMandScale = this.gl.getUniformLocation(this.shaderProgram, 'uMandScale');

    this.shaderProgram.uMandTimeSpeed = this.gl.getUniformLocation(this.shaderProgram, 'uMandTimeSpeed');

    this.shaderProgram.uMandComplexNumber = this.gl.getUniformLocation(this.shaderProgram, 'uMandComplexNumber');

    /* Textures */
    this.shaderProgram.uMandTex0 = this.gl.getUniformLocation(this.shaderProgram, 'uMandTex0');
    this.shaderProgram.uMandTex1 = this.gl.getUniformLocation(this.shaderProgram, 'uMandTex1');
    this.shaderProgram.uMandTex2 = this.gl.getUniformLocation(this.shaderProgram, 'uMandTex2');
    this.shaderProgram.uMandTex3 = this.gl.getUniformLocation(this.shaderProgram, 'uMandTex3');
  }; /* End of 'initShaders' method */

  /* Initialization of shaders */
  initTexture(...args) {

    this.numOfTextures = args.length;
  
    for (let i = 0; i < args.length; i++) {
  
      this.textures[i] = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
  
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  
      this.images[i] = new Image();
  
      this.images[i].src = args[i];
  
      this.images[i].onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.images[i]);
      }
    }
  }; /* End of 'initTextures' method */

  /* Set uniform method */
  setUniforms () {
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    this.gl.uniform1f(this.shaderProgram.uTime, this.timeMs);
      
    this.gl.uniform3fv(this.shaderProgram.uMandNumberSegment, this.numberSegment);
    this.gl.uniform3fv(this.shaderProgram.uMandSlide, this.slide);
    this.gl.uniform3fv(this.shaderProgram.uMandComplexNumber, this.complexNumber);
    this.gl.uniform1f(this.shaderProgram.uMandScale, this.scale);
    this.gl.uniform1f(this.shaderProgram.uMandTimeSpeed, this.timeSpeed);
  
    /* Textures */
    this.gl.uniform1i(this.shaderProgram.uMandTex0, 0);
    this.gl.uniform1i(this.shaderProgram.uMandTex1, 1);
    this.gl.uniform1i(this.shaderProgram.uMandTex2, 2);
    this.gl.uniform1i(this.shaderProgram.uMandTex3, 3);
  }; /* End of 'seUniforms' method */

  /* Draw scene method */
  drawScene () {
    this.timeMs = (Date.now() - this.startTime) / 1000;

    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
   
    mat4.perspective(this.pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -1.5]);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 24, 0);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexTexCoordAttribute, 3, this.gl.FLOAT, false, 24, 12);
    this.setUniforms();
  
    for (let i = 0; i < this.numOfTextures; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
    }
      
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  } /* End of 'drawScene' method */ 

  /* Listeners methods */
  handleMouseWeel(event) {
    super.handleMouseWeel();
    Mandelbrot.numberSegment[0] += event.deltaY * 0.001;
    Mandelbrot.numberSegment[1] += event.deltaY * 0.001;
  }

  handleMouseMove(event) {
    super.handleMouseMove();
    Mandelbrot.cursorPos = [event.x, event.y, 0];
    
    if (Mandelbrot.isMousePressed) {
      Mandelbrot.slide[0] += Mandelbrot.cursorPos[0] - Mandelbrot.oldCursorPos[0];
      Mandelbrot.slide[1] += Mandelbrot.cursorPos[1] - Mandelbrot.oldCursorPos[1];
      
      Mandelbrot.oldCursorPos = [event.x, event.y, 0];
    }
  }

  handleMouseDown(event) {
    super.handleMouseDown();
    Mandelbrot.oldCursorPos = [event.x, event.y, 0];
  }
  
  handleKeys() {
    super.handleKeys();
    if (Mandelbrot.currentlyPressedKeys['X'.charCodeAt(0)] ||
        Mandelbrot.currentlyPressedKeys['A'.charCodeAt(0)]) {
        Mandelbrot.numberSegment[1] += Mandelbrot.numberSegment[1] * 0.01;
    }
    if (Mandelbrot.currentlyPressedKeys['Z'.charCodeAt(0)] ||
    Mandelbrot.currentlyPressedKeys['D'.charCodeAt(0)]) {
      Mandelbrot.numberSegment[1] -= Mandelbrot.numberSegment[1] * 0.01;
    }
    if (Mandelbrot.currentlyPressedKeys['Z'.charCodeAt(0)] ||
    Mandelbrot.currentlyPressedKeys['W'.charCodeAt(0)]) {
      Mandelbrot.numberSegment[0] -= Mandelbrot.numberSegment[1] * 0.01;
    }
    if (Mandelbrot.currentlyPressedKeys['X'.charCodeAt(0)] ||
    Mandelbrot.currentlyPressedKeys['S'.charCodeAt(0)]) {
      Mandelbrot.numberSegment[0] += Mandelbrot.numberSegment[1] * 0.01;
    }
  }
}
 
function tick () {
  window.requestAnimationFrame(tick);
  
  Mandelbrot.handleKeys();
  Mandelbrot.drawScene();
}

let FizzyText = function() {
  this.realPart = 0.38;
  this.implementPart = 0.38;
  this.timeSpeed = 1.0;
};

let Mandelbrot;


function mainFunction() {
  let canvas = document.getElementById('webglCanvas');
  
  /* Create Mandelbrot */
  Mandelbrot = new ClassMandelbrot(canvas, [4.0, 4.0, 0.0], [0.3, 0.3, 0.0]);

  Mandelbrot.initGL();
  Mandelbrot.initShaders();
  Mandelbrot.initBuffers();
  Mandelbrot.initTexture("src/images/cat.png", "src/images/cat2.png", "src/images/background_space.jpg");

  Mandelbrot.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  Mandelbrot.gl.enable(Mandelbrot.gl.DEPTH_TEST);
  
  /* Control display */
  let gui = new dat.GUI();
  let params = new FizzyText();
  let controller1 = gui.add(params, 'realPart', 0.0, 0.5);
  let controller2 = gui.add(params, 'implementPart', 0.0, 0.5);
  let controller3 = gui.add(params, 'timeSpeed', 0.0, 10.0);

  controller1.onChange(function(value){
    Mandelbrot.complexNumber[0] = value;
  });
  controller2.onChange(function(value){
    Mandelbrot.complexNumber[1] = value;
  });
  controller3.onChange(function(value){
    Mandelbrot.timeSpeed = value;
  });

  //alert(gitHash.split("\n")[0]);
  //alert(gitHash.split("\n")[3]);

  /* Listners */

  document.getElementById("idGitHash").innerHTML = gitHash.split("\n")[0];
  document.getElementById("idLastUpdate").innerHTML = gitHash.split("\n")[3];
  

  gitHash.split("\n")[3]

  document.addEventListener('keydown', Mandelbrot.handleKeyDown);
  document.addEventListener('keyup', Mandelbrot.handleKeyUp);
  Mandelbrot.canvas.addEventListener('mouseup', Mandelbrot.handleMouseUp);
  Mandelbrot.canvas.addEventListener('mousedown', Mandelbrot.handleMouseDown);
  Mandelbrot.canvas.addEventListener('mousemove', Mandelbrot.handleMouseMove);
  Mandelbrot.canvas.addEventListener("wheel", Mandelbrot.handleMouseWeel);

  tick();
}

document.addEventListener('DOMContentLoaded', mainFunction);