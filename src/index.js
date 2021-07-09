

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import scatteringFragmentShader from "./FragmentScatteringShader.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"

import dat from 'dat.gui';
import * as THREE from 'three';
import { StatueScene } from "./StatueScene";



// Shaders
const occlusionShader = {
    uniforms: {
        tDiffuse: { value: null },
        lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
        exposure: { value: 0.05 },
        decay: { value: 0.99 },
        density: { value: 0.8 },
        weight: { value: 0.8 },
        samples: { value: 100 }
    },

    vertexShader: passThroughVertexShader,
    fragmentShader: scatteringFragmentShader
}

const blendingShader = {
    uniforms: {
        tDiffuse: { value: null },
        tOcclusion: { value: null }
    },

    vertexShader: passThroughVertexShader,
    fragmentShader: blendingFragmentShader
}

// Layers
const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;
const LOADING_LAYER = 2;

//Loader
const loader = new GLTFLoader();

//Renderer 
const renderer = new THREE.WebGLRenderer();


//Windows scale bug
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);



let scene = new StatueScene()

export {
    renderer,
    occlusionShader,
    blendingShader,
    loader,
    OCCLUSION_LAYER,
    DEFAULT_LAYER,
    updateShaderLightPosition
};

function update(scene) {

    updateShaderLightPosition(scene.lightSphere, scene.camera, scene.shaderUniforms)
}


function onFrame() {
    requestAnimationFrame(onFrame);
    scene.controls.update();
    update(scene);
    scene.render();
}


function updateShaderLightPosition(lightSphere, camera, shaderUniforms) {
    let screenPosition = lightSphere.position.clone().project(camera);
    let newX = 0.5 * (screenPosition.x + 1);
    let newY = 0.5 * (screenPosition.y + 1);
    let newZ = 0.5 * (screenPosition.z + 1);
    shaderUniforms.lightPosition.value.set(newX, newY, newZ)
}



function setUpSceneSelection() {
    let gui = new dat.GUI();
    gui.domElement.style.float = "left";
    gui.addFolder("Scene selection")

    let scenes = {
        "scene": StatueScene,
    }

    let sceneSelector = gui.add({ StatueScene }, "StatueScene", Object.keys(scenes));
    sceneSelector.onChange((selectedScene) => {
        let oldScene = scene;
        oldScene.destroyGUI();
        scene = new scenes[selectedScene]();

    })
    sceneSelector.setValue("scene");
}




setUpSceneSelection()
onFrame();