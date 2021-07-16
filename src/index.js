

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import scatteringFragmentShader from "./FragmentScatteringShader.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"

import dat from 'dat.gui';
import * as THREE from 'three';
import { StatueScene } from "./StatueScene";
import { StatueScene1 } from './StatueScene1';
import { StatueScene2 } from './StatueScene2';



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
    LOADING_LAYER,
    updateShaderLightPosition
};



function onFrame() {
    requestAnimationFrame(onFrame);
    scene.controls.update();
    scene.update();
    scene.render();
}


function updateShaderLightPosition(lightSphere, camera, shaderUniforms) {
    let screenPosition = lightSphere.position.clone().project(camera);
    let newX = 0.5 * (screenPosition.x + 1);
    let newY = 0.5 * (screenPosition.y + 1);
    let newZ = 0.5 * (screenPosition.z + 1);
    shaderUniforms.lightPosition.value.set(newX, newY, newZ)
}



function SelectScene() {
    let gui = new dat.GUI();
    gui.domElement.style.float = "left";
    gui.addFolder("Select Scene")

    let scenes = {
        "Scene1": StatueScene,
        "Scene2": StatueScene1,
        "Scene3": StatueScene2,
    }

    let selector = gui.add({ StatueScene }, "StatueScene", Object.keys(scenes)).name("Current Scene");
    selector.onChange((selectedScene) => {
        let oldScene = scene;
        oldScene.destroyGUI();
        scene = new scenes[selectedScene]();
        loop(scene.lightSphere, scene.camera, scene.shaderUniforms)

    })
    selector.setValue("Scene1");
}


let loop = function(lightSphere, camera){
        
    requestAnimationFrame(loop);
    var frame = 0,
    maxFrame = 360,
    lt = new Date(),
    fps = 60,
    per,
    bias,
    r = Math.PI * 2 * per,
    sin = Math.sin(r) * 30,
    cos = Math.cos(r) * 30,
    now = new Date(),
    secs = (now - lt) / 1000;
 
    per = frame / maxFrame;
    bias = 1 - Math.abs(0.5 - per) / 0.5;
 
    if (secs > 1 / fps) {
 
        // update point lights
        pointLight.position.x = 30 * bias;
        lightSphere.position.x = 30 * bias;

        pointLight.position.z = 30 * bias;
        lightSphere.position.z = 30 * bias;




        // render
        lt = new Date();
 
        // step frame
        frame += fps * secs;
        frame %= maxFrame;

        updateShaderLightPosition(lightSphere,camera, shaderUniforms)

    }

}

SelectScene();
onFrame();