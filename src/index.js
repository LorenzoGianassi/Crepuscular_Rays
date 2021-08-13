
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Clock } from 'three';

import scatteringFragmentShader from "./FragmentScatteringShader.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"
import logoFile from "../web/sun.png";
import loadingFile from "../web/load.png";
import dat from 'dat.gui';
import * as THREE from 'three';
import { StatueScene } from "./StatueScene";
import { PlaneScene } from './PlaneScene';
import { AbstractSphereScene } from './AbastractSphereScene';
import { CityScene } from './CityScene';
import { Color } from 'three';
export {
    renderer,
    occlusionShader,
    blendingShader,
    loader,
    manager,
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

//Renderer 
const renderer = new THREE.WebGLRenderer();


//Windows scale bug
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);

const manager = new THREE.LoadingManager();

//Loader

const clock = new Clock();

const delta = clock.getDelta();

const loader = new GLTFLoader(manager);

function updateShaderLightPosition(lightSphere, camera, shaderUniforms) {
    let screenPosition = lightSphere.position.clone().project(camera);
    let newX = 0.5 * (screenPosition.x + 1);
    let newY = 0.5 * (screenPosition.y + 1);
    let newZ = 0.5 * (screenPosition.z + 1);
    shaderUniforms.lightPosition.value.set(newX, newY, newZ)
}


var iconTexture = new THREE.TextureLoader().load( logoFile );
var loadingTexture = new THREE.TextureLoader().load( loadingFile );

var RESOURCE_LOADED = false;
var loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000),
    box: new THREE.Mesh(
        new THREE.BoxGeometry( 1.5, 1.5, 1.5 ),
        new THREE.MeshBasicMaterial( { map: iconTexture } )
    ),
    text: new THREE.Mesh(
        new THREE.BoxGeometry( 3, 0.5, 1 ),
        new THREE.MeshBasicMaterial( { map: loadingTexture }).opacity
    )
}

let scene = new StatueScene()

manager.onLoad = function () {
    console.log("Loading complete!")
    RESOURCE_LOADED = true
}



manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    RESOURCE_LOADED = false
    console.log(`Items loaded: ${itemsLoaded}/${itemsTotal}`)
}



manager.onError = function (url) {
    console.log('There was an error loading ' + url)
}


function onFrame() {
    loadingScreen.text.position.set(0,0,5)
    loadingScreen.box.position.set(0,0,5)

    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.text);
    loadingScreen.scene.add(loadingScreen.box);

    if (RESOURCE_LOADED == false){
        requestAnimationFrame(onFrame);
        renderer.render(loadingScreen.scene, loadingScreen.camera)
        return
    }
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