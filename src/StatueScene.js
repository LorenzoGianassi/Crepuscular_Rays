import statueFile from "../models/statueGLTF/scene.gltf";

import galaxy from "../models/backgrounds/galaxy.png";
import * as THREE from 'three';


import { DEFAULT_LAYER, loader, manager, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";

export class StatueScene extends BaseScene {

    constructor() {
        super(5, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.baseCameraPosition = new THREE.Vector3(0, 0, 200);
        this.baseSunPosition = new THREE.Vector3(0, 0, 0);
        this.effectComposer = this.composeEffects()
        this.groupBasePosition = new THREE.Vector3(0, 0, 8);

        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            animate: false,
            speed: 1,
        }
        this.angle = 0;
        this.buildScene();
        this.buildLight(0.8, 32, 32, this.baseSunPosition.x, this.baseSunPosition.y, this.baseSunPosition.z, 0xffffff);
        this.buildGUI();

    }

    render() {
        this.controls.update();

        this.camera.layers.set(OCCLUSION_LAYER);
        renderer.setClearColor("#1a1a1a")

        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        renderer.setClearColor("#000000");

        this.sceneComposer.render();
    }


    update() {
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
        this.loopSun()
    }

    loopSun() {
        if (this.options.animate == true) {
            var radius = 10,
                xPos = Math.sin(this.angle) * radius,
                yPos = Math.cos(this.angle) * radius;
            this.lightSphere.position.set(xPos, yPos, 0);
            this.pointLight.position.set(xPos, yPos, 0);
            this.angle += 0.008 * this.options.speed
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
        }
    }


    buildScene() {
        loader.load(statueFile, gltf => {
            gltf.scene.traverse(function (obj) {
                if (obj.isMesh) {
                    let material = new THREE.MeshBasicMaterial({ color: "#000000" });
                    let occlusionObject = new THREE.Mesh(obj.geometry, material)
                    occlusionObject.layers.set(OCCLUSION_LAYER)
                    if (obj.parent != null) {
                        obj.parent.add(occlusionObject)
                    }

                }
            })

            this.scene.add(gltf.scene);
            gltf.scene.position.copy(this.groupBasePosition);

        }, function (error) {
            console.error(error);
        });
        this.controls.maxDistance = 600
        this.camera.position.copy(this.baseCameraPosition);
        this.controls.update();
        this.buildBackGround(galaxy, 80, 64, 64)
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

        // folder of the GUI to enable animation
        this.gui.addFolder("Sun Movement");
        this.gui.add(this.options, "animate").name("Sun Rotation");
        this.gui.add(this.options, "speed", 0, 10, 0.01).name("Speed");
        this.gui.addFolder("Scene management")
        this.gui.add(this, "resetPosition").name("Reset Camera");
        this.gui.add(this, "resetSunPosition").name("Reset Sun");
    }
}





