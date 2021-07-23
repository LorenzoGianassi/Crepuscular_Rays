import cityFile from "../models/cityGLTF/scene.gltf";
import sky from "../models/backgrounds/cloud.jpg";

import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";
export class CityScene extends BaseScene {

    constructor() {
        super(75, window.innerWidth / window.innerHeight, 15.1, 100000);
        this.cityScene = new THREE.Group();
        this.baseCameraPosition = new THREE.Vector3(-230,-5,800);
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
        //console.log(this.camera.position)
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



    buildBackGround() {
        const textureloader = new THREE.TextureLoader();


        const starGeometry = new THREE.SphereBufferGeometry(10000, 600, 600);
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
        this.scene.add(this.cityScene);
        this.cityScene.position.y = -200;

        this.camera.position.x = -230;
        this.camera.position.y = -5;
        this.camera.position.z = 800;
        this.controls.update();
        this.buildBackGround();


        return Promise.resolve(this)
    }

    buildLight() {
        //AmbientLight
        this.ambientLight = new THREE.AmbientLight("#2c3e50");
        this.scene.add(this.ambientLight);


        //PointLight
        this.pointLight = new THREE.PointLight("#fffffff");
        this.scene.add(this.pointLight);



        let geometry = new THREE.SphereBufferGeometry(20, 32, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.lightSphere = new THREE.Mesh(geometry, material);
        this.lightSphere.layers.set(OCCLUSION_LAYER)

        this.scene.add(this.lightSphere);

    }


    buildGUI() {
        this.gui.addFolder("Light Position");
        let xController = this.gui.add(this.lightSphere.position, "x", -1000, 1000, 0.01);
        let yController = this.gui.add(this.lightSphere.position, "y", -1000, 1000, 0.01);
        let zController = this.gui.add(this.lightSphere.position, "z", -2000, 2000, 0.01);


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

        this.gui.addFolder("Scene management")
        this.gui.add(this, "resetPosition").name("Reset position")


    }


}
