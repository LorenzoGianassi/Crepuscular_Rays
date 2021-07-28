
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import scatteringFragmentShader from "./FragmentScatteringShader.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"

import dat from 'dat.gui';
import * as THREE from 'three';
import { StatueScene } from "./StatueScene";
import { PlaneScene } from './PlaneScene';
import { AbstractSphereScene } from './AbastractSphereScene';
import { CityScene } from './CityScene';
export {
    renderer,
    occlusionShader,
    blendingShader,  
    loader,
    OCCLUSION_LAYER,
    DEFAULT_LAYER,
    updateShaderLightPosition
};


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



function updateShaderLightPosition(lightSphere, camera, shaderUniforms) {
    let screenPosition = lightSphere.position.clone().project(camera);
    let newX = 0.5 * (screenPosition.x + 1);
    let newY = 0.5 * (screenPosition.y + 1);
    let newZ = 0.5 * (screenPosition.z + 1);
    shaderUniforms.lightPosition.value.set(newX, newY, newZ)
}

let scene = new StatueScene()


function onFrame() {
    requestAnimationFrame(onFrame);
    scene.controls.update();
    scene.update();
    scene.render();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
}




function SelectScene() {
    let gui = new dat.GUI();
    gui.domElement.style.float = "left";
    gui.addFolder("Select Scene")

    let scenes = {
        "StatueScene": StatueScene,
        "PlaneScene": PlaneScene,
        "SphereScene": AbstractSphereScene, 
        "CityScene": CityScene, 
      
    }

    let selector = gui.add({ StatueScene }, "StatueScene", Object.keys(scenes)).name("Current Scene");
    selector.onChange((selectedScene) => {
        let oldScene = scene;
        oldScene.destroyGUI();
        scene = new scenes[selectedScene]();
    })
    selector.setValue("StatueScene");  
}

SelectScene();
onFrame(); 