

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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

//const axesHelper = new THREE.AxesHelper(10);


//Renderer 
const renderer = new THREE.WebGLRenderer();

const camera = new THREE.PerspectiveCamera(
    5,                                   // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                  // Near clipping pane
    10000                             // Far clipping pane
);
let scene = new THREE.Scene();
let gui = new dat.GUI();
let controls = new OrbitControls(camera, renderer.domElement);
let pointLight = undefined;


let firstScene = new FirstScene(camera,gui,controls)

/*
//Camera
const camera = new THREE.PerspectiveCamera(
    5,                                   // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                  // Near clipping pane
    10000                             // Far clipping pane
);
*/


//Windows scale bug
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    document.body.appendChild(renderer.domElement);

//Control Camera
//const controls = new OrbitControls(camera, renderer.domElement);

//Loader
const loader = new GLTFLoader();

//let scene = new FirstScene();

export { renderer, occlusionShader, blendingShader, loader, OCCLUSION_LAYER, DEFAULT_LAYER, updateShaderLightPosition };

/*
// Build Light
function buildLight() {
    //AmbientLight
    let ambientLight = new THREE.AmbientLight("#2c3e50");
    scene.add(ambientLight);

    //PointLight
    let pointLight = new THREE.PointLight("#fffffff");
    scene.add(pointLight);

    //SphereGeometry
    let geometry = new THREE.SphereBufferGeometry(0.8, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    let lightSphere = new THREE.Mesh(geometry, material);
    lightSphere.add(new THREE.AxesHelper(100));
    lightSphere.layers.set(OCCLUSION_LAYER)
    scene.add(lightSphere);



    // // loop
    // var frame = 0,
    // maxFrame = 360,
    // lt = new Date(),
    // fps = 60,
    // per,
    // bias,
    // loop = function () {
    //     requestAnimationFrame(loop);
    //     var r = Math.PI * 2 * per,
    //     sin = Math.sin(r) * 30,
    //     cos = Math.cos(r) * 30,
    //     now = new Date(),
    //     secs = (now - lt) / 1000;

    //     per = frame / maxFrame;
    //     bias = 1 - Math.abs(0.5 - per) / 0.5;

    //     if (secs > 1 / fps) {

    //         // update point lights
    //         pointLight.position.x = 30 * bias;
    //         lightSphere.position.x = 30 * bias;

    //         pointLight.position.z = 30 * bias;
    //         lightSphere.position.z = 30 * bias;




    //         // render
    //         lt = new Date();

    //         // step frame
    //         frame += fps * secs;
    //         frame %= maxFrame;

    //         updateShaderLightPosition(lightSphere)

    //     }


    // };
    // loop();

    return [lightSphere, pointLight]
}

let [lightSphere, pointLight] = buildLight();
*/
/*
function buildScene() {
    loader.load(testfile, function (gltf) {
        gltf.scene.traverse(function (obj) {
            if (obj.isMesh) {
                let material = new THREE.MeshBasicMaterial({ color: "#000000" });
                let occlusionObject = new THREE.Mesh(obj.geometry, material)
                obj.add(axesHelper);
                occlusionObject.add(new THREE.AxesHelper(100));
                occlusionObject.layers.set(OCCLUSION_LAYER)
                if (obj.parent != null) {
                    obj.parent.add(occlusionObject)
                }

            }
        })

        scene.add(gltf.scene);
        gltf.scene.position.x = 3;
        gltf.scene.position.y = -0.5;
        gltf.scene.position.z = 5;
        gltf.scene.visible = true;


    }, function (error) {
        // console.error( error );
    });


    setUpGUI(pointLight, lightSphere)
    camera.position.z = 200;
    controls.update();
}
*/



/*
// PostProcessing
function composeEffects(renderer, scene, camera) {
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
    occlusionComposer.addPass(new RenderPass(scene, camera));

    //Scattering
    let scatteringPass = new ShaderPass(occlusionShader);
    occlusionComposer.addPass(scatteringPass);

    // Copy Shader
    let finalPass = new ShaderPass(CopyShader);
    occlusionComposer.addPass(finalPass);

    // Scene Composer
    let sceneComposer = new EffectComposer(renderer);
    sceneComposer.addPass(new RenderPass(scene, camera));


    //Blending Pass
    let blendingPass = new ShaderPass(blendingShader);
    blendingPass.uniforms.tOcclusion.value = target.texture;

    blendingPass.renderToScreen = true; // Whether the final pass is rendered to the screen (default framebuffer) or not.
    sceneComposer.addPass(blendingPass);

    return [occlusionComposer, sceneComposer]
}
*/

/*
function update() {
    updateShaderLightPosition(lightSphere)
    windowsUpdate();
}

let [occlusionComposer, sceneComposer] = composeEffects(renderer, scene, camera);
*/

/*
function render(camera) {
    camera.layers.set(OCCLUSION_LAYER);
    renderer.setClearColor('#342f46')
    // call the render method of the composer
    occlusionComposer.render();

    camera.layers.set(DEFAULT_LAYER);
    renderer.setClearColor("#030509");

    // call the render method of the composer
    sceneComposer.render();
}
*/

function onFrame() {
    requestAnimationFrame(onFrame);
  //requestAnimationFrame(() => onFrame(camera));
  //  controls.update();
  //  update();
    firstScene.render();
}


function updateShaderLightPosition(firstScene) {
    let screenPosition = firstScene.lightSphere.position.clone().project(camera);
    let newX = 0.5 * (screenPosition.x + 1);
    let newY = 0.5 * (screenPosition.y + 1);
    let newZ = 0.5 * (screenPosition.z + 1);
    let shaderUniforms = firstScene.occlusionComposer.passes[1].uniforms;
    shaderUniforms.lightPosition.value.set(newX, newY, newZ)
}

/*
function setUpGUI(pointLight, lightSphere) {
    let gui = new dat.GUI();
    let shaderUniforms = occlusionComposer.passes[1].uniforms;

    gui.addFolder("Light Position");
    let xController = gui.add(lightSphere.position, "x", -10, 10, 0.01);
    let yController = gui.add(lightSphere.position, "y", -10, 10, 0.01);
    let zController = gui.add(lightSphere.position, "z", -20, 20, 0.01);

    controls.addEventListener("change", () => updateShaderLightPosition(lightSphere))

    xController.onChange(x => {
        pointLight.position.x = x;
        updateShaderLightPosition(lightSphere);

    })
    yController.onChange(y => {
        pointLight.position.y = y;
        updateShaderLightPosition(lightSphere);

    })
    zController.onChange(z => {
        pointLight.position.z = z;
        updateShaderLightPosition(lightSphere);
    })



    gui.addFolder("Volumetric scattering parameters");
    // Object.keys(shaderUniforms).forEach((k) => {
    //     if (k != "tDiffuse" && k != "lightPosition") {
    //         let prop = shaderUniforms[k]
    //         switch (k) {
    //             case "weight":
    //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
    //                 break;
    //             case "exposure":
    //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
    //                 break;
    //             case "decay":
    //                 gui.add(prop, "value", 0.8, 1, 0.001).name(k);
    //                 break;
    //             case "density":
    //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
    //                 break;
    //             case "samples":
    //                 gui.add(prop, "value", 0, 200, 1).name(k);
    //                 break;
    //         }
    //     }
    // })
    gui.add(shaderUniforms.weight, "value", 0, 1, 0.01).name('Weight');
    gui.add(shaderUniforms.exposure, "value", 0, 1, 0.01).name("Exposure");
    gui.add(shaderUniforms.decay, "value", 0.8, 1, 0.001).name("Decay");
    gui.add(shaderUniforms.density, "value", 0, 1, 0.01).name("Density");
    gui.add(shaderUniforms.samples, "value", 0, 200, 1).name("Samples");
}
*/

/*
function setUpSceneSelection() {
    let gui = new dat.GUI();
    gui.domElement.style.float = "left";
    gui.addFolder("Scene selection")

    let scenes = {
        "Skull1": FirstScene,
    }

    let sceneSelector = gui.add({scene}, "scene", Object.keys(scenes));
    sceneSelector.onChange((selectedScene) => {
        let oldScene = scene;
        oldScene.destroyGUI();
        // @ts-ignore
        scene = new scenes[selectedScene]();

    })
    sceneSelector.setValue("Skull1");
}
*/



//setUpSceneSelection()

//buildScene();
onFrame();