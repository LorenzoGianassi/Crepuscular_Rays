import * as THREE from 'three';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {CopyShader} from "three/examples/jsm/shaders/CopyShader";
import scatteringFragmentShader from "./FragmentVolumetricScattering.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"
import testfile from "../models/scene.gltf";

// Layers
const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;
const LOADING_LAYER = 2;

const axesHelper = new THREE.AxesHelper(10);

const scene = new THREE.Scene();

//Camera
const camera = new THREE.PerspectiveCamera(
    750,                                   // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                  // Near clipping pane
    1000                                  // Far clipping pane
);

//Renderer 
var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);

//Control Camera
const controls = new OrbitControls(camera, renderer.domElement);

//Loader
const loader = new GLTFLoader();

function buildScene(){
    loader.load(testfile, function ( gltf ) {
        gltf.scene.traverse( function (obj) {
            if(obj.isMesh){
                let material = new THREE.MeshBasicMaterial({color: "#000000"});
                //let geometry = new THREE.PlaneGeometry(0.5, 0.5);
                let occlusionObject = new THREE.Mesh(obj.geometry, material)
                obj.add(axesHelper);
                occlusionObject.add(new THREE.AxesHelper(100));
                occlusionObject.layers.set(OCCLUSION_LAYER)
                if (obj.parent != null){
                    obj.parent.add(occlusionObject)
                }
       
            }
        })

        scene.add(gltf.scene);
            gltf.scene.position.x = 3;
            gltf.scene.position.y = 3;
            gltf.scene.position.z = 3;
            gltf.scene.visible = true;
            
    }, function ( error ) {
        console.error( error );
    } );
    
    
    //AmbientLight
    let ambientLight = new THREE.AmbientLight("#2c3e50");
    scene.add(ambientLight);
    
    //PointLight
    let pointLight = new THREE.PointLight("#fffffff");
    scene.add(pointLight);
    
    //SphereGeometry
    let geometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
    let material = new THREE.MeshBasicMaterial({color: 0xffffff});
    let lightSphere = new THREE.Mesh(geometry, material);
    lightSphere.layers.set(OCCLUSION_LAYER)
    scene.add(lightSphere);
    
    camera.position.z = 200;
    controls.update();
}


// Shaders
const occlusionShader = {
    uniforms: {
        tDiffuse: {value: null},
        lightPosition: {value: new THREE.Vector2(0.5, 0.5)},
        exposure: {value: 0.05},
        decay: {value: 0.99},
        density: {value: 0.8},
        weight: {value: 1.8},
        samples: {value: 100}
    },

    vertexShader: passThroughVertexShader,
    fragmentShader: scatteringFragmentShader
}

const blendingShader = {
    uniforms: {
        tDiffuse: {value: null},
        tOcclusion: {value: null}
    },

    vertexShader: passThroughVertexShader,
    fragmentShader: blendingFragmentShader
}


// PostProcessing
function composeEffects(renderer, scene, camera){
    const renderTargetParameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        stencilBuffer: false
    };

    // A preconfigured render target internally used by EffectComposer.
	let target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);

    //OcclusionComposer
    let occlusionComposer = new EffectComposer(renderer,target); 
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



function update() {}

let [occlusionComposer, sceneComposer] = composeEffects(renderer, scene, camera);

function render(camera) {
    camera.layers.set(OCCLUSION_LAYER);

    // call the render method of the composer
    occlusionComposer.render();

    camera.layers.set(DEFAULT_LAYER);
    renderer.setClearColor("#030509");

    // call the render method of the composer
    sceneComposer.render();
}

function onFrame(camera) {
    requestAnimationFrame(() => onFrame(camera));
    controls.update();
    update();
    render(camera);
}

buildScene();
onFrame(camera);