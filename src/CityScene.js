import cityFile from "../models/cityGLTF/scene.gltf";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class CityScene extends BaseScene {

    constructor() {
        super();

        this.camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 0.1, 10000)
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.AbstractSphereScene = new THREE.Group
        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.options = {
            color: "#ffffff",
            animate: false,
        }
        this.angle = 0;
        this.buildScene();
        this.buildLight();
        this.buildGUI();

    }


    render() {
        this.controls.update();
        this.camera.layers.set(OCCLUSION_LAYER);
        renderer.setClearColor("#1a1a1a")


        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        // renderer.setClearColor("#030509");

        this.sceneComposer.render();
    }


    update() {
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms);
        // this.rotateSphere();      
        this.loopSun();  
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
        this.AbstractSphereScene = (await this.asyncLoad(cityFile)).scene
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
        this.AbstractSphereScene.position.z = 5;

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



        let geometry = new THREE.SphereBufferGeometry(4, 32, 32);
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

        this.gui.addFolder("Change color");
        this.gui.addColor(this.options, "color").onFinishChange(() => {
            this.lightSphere.material.setValues({
                color: this.options.color
            });
            this.update()
        });
        // folder of the GUI to enable animation
        this.gui.addFolder("Sun MOvement");
        this.gui.add(this.options, "animate").name("Move Sun");

    }


}
