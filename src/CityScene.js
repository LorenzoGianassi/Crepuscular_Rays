import cityFile from "../models/cityGLTF/scene.gltf";
import sky from "../models/backgrounds/cloud.jpg";

import * as THREE from 'three';
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class CityScene extends BaseScene {

    constructor() {
        super(50, window.innerWidth / window.innerHeight, 15.1, 100000);
        this.cityScene = new THREE.Group();
        this.baseCameraPosition = new THREE.Vector3(-2440,-840,-150);
        this.groupBasePosition = new THREE.Vector3(-850,-1060,-250);
        this.baseSunPosition = new THREE.Vector3(0,0,0);
        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            animate: false,
            sun_speed: 1,
        }

        this.angle = 0;
        // variables for the fly of the plane
        this.up = new THREE.Vector3(0, 0, -1);
        this.axis = new THREE.Vector3();
        this.pos = 0;
        this.pointsPath = this.createPath()
        this.buildScene();
        this.buildLight(50, 80, 80, this.baseSunPosition.x, this.baseSunPosition.y, this.baseSunPosition.z, 0xd9be6d);
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
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);
        this.riseSun();

    }

    createPath() {
        const pointsPath = new THREE.CurvePath();
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-600, -1000, -1400), 
            new THREE.Vector3(0, 100, -1000),
            new THREE.Vector3(20, 250, -800),
            new THREE.Vector3(20, 250, -600),
            new THREE.Vector3(100, -1000, 500), 
        ]);

        var points = curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);

        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });

        // Create the final object to add to the scene
        var curveObject = new THREE.Line(geometry, material);
        this.scene.add(curveObject)

        pointsPath.add(curve);
        return pointsPath;
    }

    riseSun() {
        if (this.options.animate == true) {

            const newPosition = this.pointsPath.getPoint(this.pos);
            const tangent = this.pointsPath.getTangent(this.pos);
            this.lightSphere.position.copy(newPosition);
            this.pointLight.position.copy(newPosition);
            this.axis.crossVectors(this.up, tangent).normalize();
            const radians = Math.acos(this.up.dot(tangent));
            this.lightSphere.quaternion.setFromAxisAngle(this.axis, radians);
            this.pointLight.quaternion.setFromAxisAngle(this.axis, radians);
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
            renderer.render(this.scene, this.camera);
            this.pos += 0.0005*this.options.sun_speed;
            if (this.pos > 1) {
                this.pos = 0;
                updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
            }

        }

    }




    asyncLoad(filepath, onProgress = () => {
    }) {
        return new Promise(((resolve, reject) => {
            loader.load(filepath, gltf => {
                resolve(gltf);
            },
                onProgress,
                error => {
                    reject(error);
                });
        }))
    }


    async buildScene() {
        this.cityScene = (await this.asyncLoad(cityFile)).scene
        this.cityScene.traverse(function (obj) {
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
        this.cityScene.position.copy(this.groupBasePosition);     
        this.scene.add(this.cityScene);
        this.controls.target.set(-750, -700, 0)
        this.cityScene.rotation.y = 11.5;

        this.controls.minAzimuthAngle = -Math.PI ;

        this.controls.maxAzimuthAngle = -Math.PI + Math.PI ;
        this.controls.minPolarAngle = Math.PI / 4 + Math.PI / 5;
        this.controls.maxPolarAngle = Math.PI / 3 + Math.PI / 5;
        this.controls.minDistance = 800;
        this.controls.maxDistance = 1600


        this.controls.update();
        this.buildBackGround(sky, 20000, 128, 128);


        return Promise.resolve(this)
    }


    buildGUI() {
        this.gui.addFolder("Light Position");
        let xController = this.gui.add(this.lightSphere.position, "x", -120, 120, 0.01);
        let yController = this.gui.add(this.lightSphere.position, "y", -120, 120, 0.01);
        let zController = this.gui.add(this.lightSphere.position, "z", -200, 200, 0.01);


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

        // folder of the GUI to enable animation
        this.gui.addFolder("Sun Movement");
        this.gui.add(this.options, "animate").name("Move Sun");
        this.gui.add(this.options, "sun_speed", 0, 10, 0.01).name("Speed");

        this.gui.addFolder("Scene management")
        this.gui.add(this, "resetPosition").name("Reset position")
        this.gui.add(this, "resetSunPosition").name("Reset Sun") 



    }



}
