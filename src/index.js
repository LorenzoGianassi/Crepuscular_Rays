//import "./styles.scss"

import * as THREE from 'THREE';

var GLTFLoader = require("THREE/examples/jsm/loaders/GLTFLoader.js");

import {OrbitControls} from "THREE/examples/jsm/controls/OrbitControls";
var EffectComposer = require("THREE/examples/jsm/postprocessing/EffectComposer");

import {RenderPass} from "THREE/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "THREE/examples/jsm/postprocessing/ShaderPass";
import vertexShader from "./VertexShader.glsl"

var scatteringFragmentShader = require("./ScatteringFragmentShader.glsl");

var blendingFragmentShader = require("./BlendingFragmentShader.glsl");




const occlusionShader = {
    uniforms: {
        smpDiffuse: {value: null},
        lightPosition: {value: new THREE.Vector2(0.5, 0.5)},
        exposure: {value: 0.05},
        decay: {value: 0.99},
        density: {value: 0.8},
        weight: {value: 0.8},
        samples: {value: 200}
    },

    vertexShader: vertexShader,
    fragmentShader: scatteringFragmentShader
}

const blendingShader = {
    uniforms: {
        smpDiffuse: {value: null},
        smpOcclusion: {value: null}
    },

    vertexShader: vertexShader,
    fragmentShader: blendingFragmentShader
}

const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;

const axesHelper = new THREE.AxesHelper(10);

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


const renderer = new THREE.WebGLRenderer();
let controls = new OrbitControls(camera, renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


var loader = new GLTFLoader.GLTFLoader();
loader.load('scene.gltf', skull => {
    skull.scene.traverse(o => {
        if (o instanceof THREE.Mesh) {
            let material = new THREE.MeshBasicMaterial({color: "#000000"});
            let occlusionObject = new THREE.Mesh(o.geometry, material)

            o.add(axesHelper);

            occlusionObject.add(new THREE.AxesHelper(10));
            occlusionObject.layers.set(OCCLUSION_LAYER)
            o.parent?.add(occlusionObject)
        }
    })

    scene.add(skull.scene);
    skull.scene.position.z = 2;
}, undefined, error => {
    console.error(error);
});



loader.load('scene.gltf', function (skull) {
    skull.scene.traverse(function (o) {
        var _a;
        if (o instanceof THREE.Mesh) {
            var material = new THREE.MeshBasicMaterial({ color: "#000000" });
            var occlusionObject = new THREE.Mesh(o.geometry, material);
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


//AmbientLight
let ambientLight = new THREE.AmbientLight("#2c3e50");
scene.add(ambientLight);

//PointLight
let pointLight = new THREE.PointLight("#ffffff");
scene.add(pointLight);

//SphereGeometry// forse sole
let geometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
let material = new THREE.MeshBasicMaterial({color: 0xffffff});
let lightSphere = new THREE.Mesh(geometry, material);
lightSphere.layers.set(OCCLUSION_LAYER)
scene.add(lightSphere);

camera.position.z = 6;
controls.update();



//EffectComposer
function composeEffects() {
    const renderTargetParameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        stencilBuffer: false
    };
    let occlusionRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth / 2, window.innerHeight / 2, renderTargetParameters)

    //SceneComposer
    let sceneComposer = new EffectComposer.EffectComposer(renderer);
    sceneComposer.addPass(new RenderPass(scene, camera));

    //OcclusionComposer
    let occlusionComposer = new EffectComposer.EffectComposer(renderer, occlusionRenderTarget);
    occlusionComposer.addPass(new RenderPass(scene, camera));

    let scatteringPass = new ShaderPass(occlusionShader);
    occlusionComposer.addPass(scatteringPass);



    //Blending Pass
    let blendingPass = new ShaderPass(blendingShader);
    blendingPass.uniforms.smpOcclusion.value = occlusionRenderTarget.texture;
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