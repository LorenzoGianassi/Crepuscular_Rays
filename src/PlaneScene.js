
import planeFile from "../models/planeGLTF/scene.gltf";

import sky from "../models/backgrounds/cloud_texture.jpg";
import * as THREE from 'three';
import {
    AmbientLight,
    AxesHelper,
    Clock,
    Group,
    LoopRepeat,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PointLight,
    SphereBufferGeometry,
    TextureLoader
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class PlaneScene extends BaseScene {

    constructor() {
        super();

        this.camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 0.1, 10000)
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.planeGroupScene = new THREE.Group
        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            color: "#ffffff",
            animate: false,
            animation_speed: 1,
        }
        this.clock = new Clock()
        this.angle = 0;
        this.up = new THREE.Vector3(0, 0, -1);
        this.axis = new THREE.Vector3();
        this.spline = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-100, 20, 100),
            new THREE.Vector3(-40, 20, 20),
            new THREE.Vector3(70, 20, 10),
            new THREE.Vector3(100, 20, 30),
            new THREE.Vector3(-100, 20, 100)]);
        this.splinePoint = this.spline.getPoints(50)
        this.pos = 0;
        this.pointsPath = this.createPath()

        this.buildScene();
        this.buildLight();
        this.mixer = new THREE.AnimationMixer();
        this.buildGUI();

    }


    render() {
        this.controls.update();


        this.camera.layers.set(OCCLUSION_LAYER);
        renderer.setClearColor("#1a1a1a")

        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        renderer.setClearColor("#030509");

        this.sceneComposer.render();
    }


    update() {
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
        var delta = this.clock.getDelta()
        this.mixer.update(delta * this.options.animation_speed)
        this.flyPlane()

    }



    loopSun() {
        if (this.options.animate == true) {
            var radius = 10,
                xPos = Math.sin(this.angle) * radius,
                yPos = Math.cos(this.angle) * radius;
            this.lightSphere.position.set(xPos, yPos, 0);
            this.pointLight.position.set(xPos, yPos, 0);

            this.angle += 0.008
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
        }
    }

    positionLight() {
        let light = this.scene.getObjectByName('pointLight');
        if (pos <= 1) {
            light.position = spline.getPointAt(pos);
            pos += 0.001
        } else {
            pos = 0;
        }
    }

    createPath() {

        const pointsPath = new THREE.CurvePath();

        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-15, 0, 3), 
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(15, 0, 3),
            new THREE.Vector3(0, 0, 6),
        ],true);

        var points = curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);

        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });

        // Create the final object to add to the scene
        var curveObject = new THREE.Line(geometry, material);
        this.scene.add(curveObject)



        pointsPath.add(curve);
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
            this.pos += 0.0005;
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
                //obj.add(axesHelper);
                occlusionObject.add(new THREE.AxesHelper(100));
                occlusionObject.layers.set(OCCLUSION_LAYER)
                if (obj.parent != null) {
                    obj.parent.add(occlusionObject)
                }


            }
        })
        this.scene.add(this.planeGroupScene);
        this.planeGroupScene.position.x = -15;
        this.planeGroupScene.position.y = 0;
        this.planeGroupScene.position.z = 3;
        this.scene.add(new AxesHelper(10))

        this.camera.position.z = 200;
        this.controls.update();
        this.buildBackGround()


        return Promise.resolve(this)
    }

    buildLight() {
        //AmbientLight
        this.ambientLight = new THREE.AmbientLight("#2c3e50");
        this.scene.add(this.ambientLight);


        //PointLight
        this.pointLight = new THREE.PointLight("#fffffff");
        this.scene.add(this.pointLight);



        let geometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.lightSphere = new THREE.Mesh(geometry, material);
        this.lightSphere.layers.set(OCCLUSION_LAYER)
        this.lightSphere.position.y = 6


        this.scene.add(this.lightSphere);

    }



    buildBackGround() {
        const textureloader = new THREE.TextureLoader();
        const starGeometry = new THREE.SphereBufferGeometry(80, 64, 64);
        const texture = textureloader.load(sky);
        const starMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
        });
        // const starMesh = new THREE.Mesh(starGeometry,starMaterial);
        let backgroundSphere = new THREE.Mesh(starGeometry, starMaterial);
        this.scene.add(backgroundSphere);

        backgroundSphere.layers.set(DEFAULT_LAYER);
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

        this.gui.addFolder("Change color");
        this.gui.addColor(this.options, "color").onFinishChange(() => {
            this.lightSphere.material.setValues({
                color: this.options.color
            });
            this.update()
        });
        // folder of the gUI to enable animation
        this.gui.addFolder("Flying Management");
        this.gui.add(this.options, "animate").name("Enable Fly");
        this.gui.addFolder("Speed of the animations",);
        this.gui.add(this.options, "animation_speed", 0, 2, 0.01).name("Speed");

    }






}

