import * as THREE from 'three';
import {
    AmbientLight,
    AxesHelper,
    LinearFilter, Material,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PointLight,
    RGBFormat,
    Scene,
    SphereBufferGeometry,
    Vector2,
    WebGLRenderer,
    WebGLRenderTarget
} from "three";
import {GLTFLoader} from 'THREE/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from "THREE/examples/jsm/controls/OrbitControls";
import {EffectComposer} from "THREE/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "THREE/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "THREE/examples/jsm/postprocessing/ShaderPass";
import scatteringFragmentShader from "./FragmentVolumetricScattering.glsl"
import passThroughVertexShader from "./PassThroughVertexShader.glsl"
import blendingFragmentShader from "./BlendingFragmentShader.glsl"
import passThroughFragmentShader from "./PassThroughFragmentShader.glsl"
import doggoFile from "../models/scene.gltf";


const occlusionShader = {
    uniforms: {
        tDiffuse: {value: null},
        lightPosition: {value: new Vector2(0.5, 0.5)},
        exposure: {value: 0.05},
        decay: {value: 0.99},
        density: {value: 0.8},
        weight: {value: 0.8},
        samples: {value: 200}
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


const passThroughShader = {
    uniforms: {
        tDiffuse: {value: null},
        tOcclusion: {value: null}
    },

    vertexShader: passThroughVertexShader,
    fragmentShader: passThroughFragmentShader
}



const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;
const LOADING_LAYER = 2;

const axesHelper = new THREE.AxesHelper(10);

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


const renderer = new THREE.WebGLRenderer();
let controls = new OrbitControls(camera, renderer.domElement);


renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);


const loaderLondonHall = new GLTFLoader();

loaderLondonHall.load(doggoFile, function ( gltf ) {
    let material = new MeshBasicMaterial({color: "#000000"});
    let doggoGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    let occlusionObject = new Mesh(doggoGeometry, material)
    scene.add(gltf.scene);

    occlusionObject.add(new AxesHelper(10));
    occlusionObject.layers.set(OCCLUSION_LAYER)
    scene.add(gltf.scene);
        gltf.scene.position.z = 2;
}, function ( error ) {
    console.error( error );
} );

/*
var loader = new GLTFLoader();

loader.load(doggoFile, function (skull) {
    skull.scene.traverse(function (o) {
        var _a;
        if (o instanceof THREE.Mesh) {
            var material = new THREE.MeshBasicMaterial({ color: "#000000" });
            var occlusionObject = new THREE.Mesh(o.geometry, o.material);
            o.add(axesHelper);
            occlusionObject.add(new THREE.AxesHelper(10));
            occlusionObject.layers.set(OCCLUSION_LAYER);
            (_a = o.parent) === null || _a === void 0 ? void 0 : _a.add(occlusionObject);
        }
    });
    scene.add(skull.scene);
    skull.scene.position.z = 2;
}, undefined, function (error) {
    console.error(error);
});
*/

//AmbientLight
let ambientLight = new THREE.AmbientLight("#2c3e50");
scene.add(ambientLight);

//PointLight
let pointLight = new THREE.PointLight("#000000");
scene.add(pointLight);

//SphereGeometry// forse sole
let geometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
let material = new THREE.MeshBasicMaterial({color: 0xffffff});
let lightSphere = new THREE.Mesh(geometry, material);
lightSphere.layers.set(OCCLUSION_LAYER)
scene.add(lightSphere);

camera.position.z = 6;
controls.update();

function composeEffects(){
    const renderTargetParameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        stencilBuffer: false
    };
	let target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);


        //OcclusionComposer
    let occlusionComposer = new EffectComposer(renderer, target);
    occlusionComposer.addPass(new RenderPass(scene, camera));

        //Scattering
    let scatteringPass = new ShaderPass(occlusionShader);
    occlusionComposer.addPass(scatteringPass);
    
    //SceneComposer
    let sceneComposer = new EffectComposer(renderer);
    sceneComposer.addPass(new RenderPass(scene, camera));


    let dummyPass = new ShaderPass(passThroughShader);
    occlusionComposer.addPass(dummyPass);



    //Blending Pass
    let blendingPass = new ShaderPass(blendingShader);
    blendingPass.uniforms.tOcclusion.value = target.texture;
    blendingPass.renderToScreen = true;
    sceneComposer.addPass(blendingPass);

    return [occlusionComposer, sceneComposer]
}



function update() {}

let [occlusionComposer, sceneComposer] = composeEffects();

function render() {
    camera.layers.set(OCCLUSION_LAYER);
    occlusionComposer.render();

    camera.layers.set(DEFAULT_LAYER);
    renderer.setClearColor("#030509");
    sceneComposer.render();
}

function onFrame() {
    requestAnimationFrame(onFrame);
    controls.update();
    update();
    render();
}

onFrame();