import * as THREE from 'three';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader";
import { blendingShader, occlusionShader, renderer } from "./index.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';
import dat from 'dat.gui';
import { Scene } from 'three';

/**
 @constructor
 @abstract
 */
export var AbstractScene = function () {

  this.camera = new THREE.PerspectiveCamera();
  this.scene = new THREE.Scene();
  this.gui = new dat.GUI();
  this.controls = new OrbitControls(camera, renderer.domElement);


/**
 @abstract
 */
AbstractScene.prototype.render = function () {  };

/**
 @abstract
 */
AbstractScene.prototype.destroyGUI = function () {
  this.gui.destroy();
};

/**
 @abstract
 */
AbstractScene.prototype.buildGUI = function () { };

/**
 @abstract
 */
AbstractScene.prototype.composeEffects = function () {
  // PostProcessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false
  };

  // A preconfigured render target internally used by EffectComposer.
  let target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);

  //OcclusionComposer
  let occlusionComposer = new EffectComposer(renderer, target);
  occlusionComposer.addPass(new RenderPass(this.scene, this.camera));

  //Scattering
  let scatteringPass = new ShaderPass(occlusionShader);
  occlusionComposer.addPass(scatteringPass);

  //HorizonatlBlur
  let horizontalBlurPass = new ShaderPass(HorizontalBlurShader);
  horizontalBlurPass.uniforms.h.value = 0.4 / occlusionRenderTarget.height;
  // occlusionComposer.addPass(horizontalBlurPass);

  //VerticalBlur
  let verticalBlurPass = new ShaderPass(VerticalBlurShader);
  verticalBlurPass.uniforms.v.value = 0.4 / occlusionRenderTarget.width;
  // occlusionComposer.addPass(verticalBlurPass);

  // Copy Shader
  let finalPass = new ShaderPass(CopyShader);
  occlusionComposer.addPass(finalPass);

  // Scene Composer
  let sceneComposer = new EffectComposer(renderer);
  sceneComposer.addPass(new RenderPass(this.scene, this.camera));

  //Blending Pass
  let blendingPass = new ShaderPass(blendingShader);
  blendingPass.uniforms.tOcclusion.value = target.texture;

  blendingPass.renderToScreen = true; // Whether the final pass is rendered to the screen (default framebuffer) or not.
  sceneComposer.addPass(blendingPass);

  return [occlusionComposer, sceneComposer]
}

  if (this.constructor === AbstractScene) {
    throw new Error('Cannot instanciate abstract class');
  }
};

