import sphereFile from "../models/abstractSphereGLTF/scene.gltf";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class AbstractSphereScene extends BaseScene {

    constructor() {
        super(5, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.baseCameraPosition = new THREE.Vector3(0,0,200);
        this.AbstractSphereScene = new THREE.Group
        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            animate: true, 
        }
        this.angle = 0;
        this.buildScene();
        this.buildLight();
        this.buildGUI();

    }


    render() {
        this.controls.update();
        this.camera.layers.set(OCCLUSION_LAYER);

        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        renderer.setClearColor("#030509");

        this.sceneComposer.render();
    }


    update() {
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);
        this.rotateSphere();        
    }



    rotateSphere() {
        if (this.options.animate == true) {
            var radius = 6,
            xpos = Math.sin(this.angle) * radius,
            zpos = Math.cos(this.angle) * radius;

            this.AbstractSphereScene.position.set(xpos, 0, zpos)
            this.AbstractSphereScene.rotation.x += 0.01;
            this.AbstractSphereScene.rotation.z += 0.05;


            this.angle += 0.009;
            updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)

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
        this.AbstractSphereScene = (await this.asyncLoad(sphereFile)).scene
        this.AbstractSphereScene.traverse(function (obj) {
            if (obj.isMesh) {
                let material = new THREE.MeshBasicMaterial({ color: "#000000" });
                let occlusionObject = new THREE.Mesh(obj.geometry, material);
                occlusionObject.layers.set(OCCLUSION_LAYER)
                if (obj.parent != null) { 
                    obj.parent.add(occlusionObject)
                }


            }
        })
        this.scene.add(this.AbstractSphereScene);
        this.AbstractSphereScene.position.z = 6;

        this.camera.position.z = 200;
        this.controls.update();


        return Promise.resolve(this)
    }

    buildLight() {
        //AmbientLight
        this.ambientLight = new THREE.AmbientLight("#2c3e50");
        this.scene.add(this.ambientLight); 


        //PointLight
        this.pointLight = new THREE.PointLight("#fffffff");
        this.scene.add(this.pointLight); 



        let geometry = new THREE.SphereBufferGeometry(1.2, 32, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.lightSphere = new THREE.Mesh(geometry, material);
        this.lightSphere.layers.set(OCCLUSION_LAYER)

        this.scene.add(this.lightSphere);

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
        this.gui.addFolder("Rotation Management");
        this.gui.add(this.options, "animate").name("Enable Rotation");
        this.gui.addFolder("Scene management")
        this.gui.add(this, "resetPosition").name("Reset position")

    }

}
