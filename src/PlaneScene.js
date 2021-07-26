
import planeFile from "../models/planeGLTF/scene.gltf";

import sky from "../models/backgrounds/cloud.jpg";
import * as THREE from 'three';
import {Clock} from "three";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class PlaneScene extends BaseScene {

    constructor() {
        super(6, window.innerWidth / window.innerHeight, 20.1, 10000);
        this.baseCameraPosition = new THREE.Vector3(0,0,350);
        this.baseSunPosition = new THREE.Vector3(0,0,0);
        this.planeGroupScene = new THREE.Group();
        this.groupBasePosition = new THREE.Vector3(0,0,0);

        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            animate: true,
            animation_speed: 1,
            flying_speed: 1,
        }
        this.clock = new Clock()
        this.angle = 0;
        // variables for the fly of the plane
        this.up = new THREE.Vector3(0, 0, -1);
        this.axis = new THREE.Vector3();
        this.pos = 0;
        this.curve = this.cirleLoop()

        this.buildScene();
        this.buildLight(0.9, 32, 32, this.baseSunPosition.x,this.baseSunPosition.y,this.baseSunPosition.z, 0xffffff);
        this.mixer = new THREE.AnimationMixer();
        this.buildGUI();

    }


    render() {
        this.controls.update();


        this.camera.layers.set(OCCLUSION_LAYER);
        renderer.setClearColor("#1a1a1a")

        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
 

        this.sceneComposer.render();
    }


    update() {
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
        var delta = this.clock.getDelta()
        this.mixer.update(delta * this.options.animation_speed)
        this.flyPlane()
    }

    cirleLoop(){
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-15, -10, 0), 
            new THREE.Vector3(0, -10, -6),
            new THREE.Vector3(15, -10, 0),
            new THREE.Vector3(0, -10, 6),
        ],true);

        return curve
    }

    rollerCoasterLoop(){
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-15, -10, 0), 
            new THREE.Vector3(-8, -5, -6),
            new THREE.Vector3(0, -10, -6), 
            new THREE.Vector3(8, -5, -6),
            new THREE.Vector3(15, -10, 0),
            new THREE.Vector3(8, -5, 6),
            new THREE.Vector3(0, -10, 6), 
            new THREE.Vector3(-8, -5, 6),
        ],true);

        return curve
    }

    createPath() {
        const pointsPath = new THREE.CurvePath();
        var points = this.curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);

        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });

        // Create the final object to add to the scene
        var curveObject = new THREE.Line(geometry, material);
        this.scene.add(curveObject)

        pointsPath.add(this.curve);
        return pointsPath;
    }


    flyPlane() {
        if (this.options.animate == true) {

            const newPosition = this.pointsPath.getPoint(this.pos);
            const tangent = this.pointsPath.getTangent(this.pos);
            this.planeGroupScene.position.copy(newPosition);
            this.axis.crossVectors(this.up, tangent).normalize();
            const radians = Math.acos(this.up.dot(tangent));
            this.planeGroupScene.quaternion.setFromAxisAngle(this.axis, radians);

            renderer.render(this.scene, this.camera);
            this.pos += 0.0005*this.options.flying_speed;
            if (this.pos > 1) {
                this.pos = 0;
            }

        }

    }

    animateMesh(gltf) {
        this.mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
            this.mixer.clipAction(clip).play();
        });
    }


    asyncLoad(filepath, onProgress = () => {
    }) {
        return new Promise(((resolve, reject) => {
            loader.load(filepath, gltf => {
                this.animateMesh(gltf)
                resolve(gltf);
            },
                onProgress,
                error => {
                    reject(error);
                });
        }))
    }


    async buildScene() {
        this.planeGroupScene = (await this.asyncLoad(planeFile)).scene
        this.planeGroupScene.traverse(function (obj) {
            if (obj.isMesh) {
                let material = new THREE.MeshBasicMaterial({ color: "#000000" });
                let occlusionObject = new THREE.Mesh(obj.geometry, material);
                occlusionObject.layers.set(OCCLUSION_LAYER)
                if (obj.parent != null) {
                    obj.parent.add(occlusionObject)
                }


            }
        })

        this.camera.position.copy(this.baseCameraPosition);     
        this.planeGroupScene.position.copy(this.groupBasePosition);     
        this.scene.add(this.planeGroupScene);

        this.controls.target.set(0, -5, 0)

        this.controls.minDistance = 100;
        this.controls.maxDistance = 300

        this.camera.position.copy(this.baseCameraPosition);     
        this.controls.update();
        this.buildBackGround(sky, 80, 64, 64);
        
        return Promise.resolve(this)
    }

    

    buildGUI() {
        this.gui.addFolder("Light Position");
        let xController = this.gui.add(this.lightSphere.position, "x", -10, 10, 0.01);
        let yController = this.gui.add(this.lightSphere.position, "y", -10, 10, 0.01);
        let zController = this.gui.add(this.lightSphere.position, "z", -20, 20, 0.01);


        this.controls.addEventListener("change", () => updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms))

        xController.onChange(x => {
            this.pointLight.position.x = x;
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);

        })
        yController.onChange(y => {
            this.pointLight.position.y = y;
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);

        })
        zController.onChange(z => {
            this.pointLight.position.z = z;
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);
        })



        this.gui.addFolder("Volumetric scattering parameters");

        this.gui.add(this.shaderUniforms.weight, "value", 0, 1, 0.01).name('Weight');
        this.gui.add(this.shaderUniforms.exposure, "value", 0, 1, 0.01).name("Exposure");
        this.gui.add(this.shaderUniforms.decay, "value", 0.8, 1, 0.001).name("Decay");
        this.gui.add(this.shaderUniforms.density, "value", 0, 1, 0.01).name("Density");
        this.gui.add(this.shaderUniforms.samples, "value", 0, 200, 1).name("Samples");


        // folder of the gUI to enable animation
        this.gui.addFolder("Flying Management");
        this.gui.add(this.options, "animate").name("Enable Fly");
        this.gui.addFolder("Select Route");
        let CircleLoop = this.cirleLoop()
        let RollerCoasterLoop = this.rollerCoasterLoop()
        let routes = {
            "CircleLoop": CircleLoop,
            "RollerCoasterLoop": RollerCoasterLoop,
        }
        let selector = this.gui.add({ CircleLoop }, "CircleLoop", Object.keys(routes)).name("Routes");
        selector.onChange((selectedRoutes) => {
            this.curve = routes[selectedRoutes];   
            this.pointsPath = this.createPath()
        })
        selector.setValue("CircleLoop"); 
        this.gui.addFolder("Speed of the animations",);
        this.gui.add(this.options, "animation_speed", 0, 2, 0.01).name("Speed");
        this.gui.addFolder("Speed of Flying",);
        this.gui.add(this.options, "flying_speed", 0, 10, 0.01).name("Speed");

        this.gui.addFolder("Scene management")
        this.gui.add(this, "resetPosition").name("Reset position")
        this.gui.add(this, "resetSunPosition").name("Reset Sun") 

    }






}

