

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import scatteringFragmentShader from "./FragmentVolumetricScattering.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"
import testfile from "../models/scene.gltf";

import dat from 'dat.gui';
import * as THREE from 'three';
import { AbstractScene } from "./AbstractScene";

import { FirstScene } from "./FirstScene";



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


/*
// Camera
let camera = new THREE.PerspectiveCamera(
    5,                                   // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                  // Near clipping pane
    10000                             // Far clipping pane
);
*/

//let gui = new dat.GUI();
//let controls = new OrbitControls(camera, renderer.domElement);


//Windows scale bug
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);



let firstScene = new FirstScene()


//Control Camera
//const controls = new OrbitControls(camera, renderer.domElement);



//let scene = new FirstScene();

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
    firstScene.controls.update();
    update(firstScene);
    firstScene.render();
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
        "scene": FirstScene,
    }

    let sceneSelector = gui.add({ firstScene }, "firstScene", Object.keys(scenes));
    sceneSelector.onChange((selectedScene) => {
        let oldScene = firstScene;
        oldScene.destroyGUI();
        // @ts-ignore
        firstScene = new scenes[selectedScene]();

    })
    sceneSelector.setValue("scene");
}




setUpSceneSelection()
onFrame();