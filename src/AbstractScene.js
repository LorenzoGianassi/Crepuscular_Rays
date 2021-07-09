import * as THREE from 'three';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { blendingShader, occlusionShader, renderer } from "./index.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import dat from 'dat.gui';
import { Scene } from 'three';

export class AbstractScene {

  constructor() {
    //this.scene = scene;
    //this.gui = gui;
    
    this.scene = new THREE.Scene;
    //this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10)
    this.gui = new dat.GUI();
    //this.controls = new OrbitControls(this.camera, renderer.domElement);
    




    /*
    this.camera = new THREE.PerspectiveCamera();
    this.scene = new THREE.Scene();
    this.gui = new dat.GUI();
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.pointLight = undefined;
    this.lightSphere = undefined;
    */

  }


  render() {
    throw new Error("Method must be implemented.");
  }

  buildGUI() {
    throw new Error("Method must be implemented.");
  }

  destroyGUI() {
    this.gui.destroy();
  }

  updateShaderLightPosition() {
    throw new Error("Method must be implemented.");
  }

  buildScene() {
    throw new Error("Method must be implemented.");
  }


  composeEffects() {
    // PostProcessing
    const renderTargetParameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: false
    };

    // A preconfigured render target internally used by EffectComposer.
    let target = new THREE.WebGLRenderTarget(window.innerWidth / 2, window.innerHeight / 2, renderTargetParameters)

    //OcclusionComposer
    let occlusionComposer = new EffectComposer(renderer, target);
    occlusionComposer.addPass(new RenderPass(this.scene, this.camera));

    //Scattering
    let scatteringPass = new ShaderPass(occlusionShader);
    this.shaderUniforms = scatteringPass.uniforms
    occlusionComposer.addPass(scatteringPass);

    //HorizonatlBlur
    let horizontalBlurPass = new ShaderPass(HorizontalBlurShader);
    horizontalBlurPass.uniforms.h.value = 0.4 / target.height;
    // occlusionComposer.addPass(horizontalBlurPass);

    //VerticalBlur
    let verticalBlurPass = new ShaderPass(VerticalBlurShader);
    verticalBlurPass.uniforms.v.value = 0.4 / target.width;
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
}



