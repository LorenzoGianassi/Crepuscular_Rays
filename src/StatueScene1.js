import testfile from "../models/newScene/scene.gltf";
import sky from "../models/backgrounds/sky_texture.jpg";
import * as THREE from 'three';
import {
    AmbientLight,
    AxesHelper,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PointLight,
    SphereBufferGeometry,
    TextureLoader,
    Vector3
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { BaseScene } from "./BaseScene";

export class StatueScene1 extends BaseScene {

    constructor() {
        super();
        
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 30, 10000)
        this.controls = new OrbitControls(this.camera, renderer.domElement);
    
        this.cameraInitialPosition = new Vector3(-14, 0, -20)
        this.effectComposer = this.composeEffects()
        this.occlusionComposer = this.effectComposer[0]
        this.sceneComposer = this.effectComposer[1]
        this.buildScene();
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


    update(){
        updateShaderLightPosition(this.lightSphere, this.camera, this.shaderUniforms)
      
        console.log(this.camera.position);
    }


    buildScene() {
        loader.load(testfile, gltf => {
            gltf.scene.traverse(function (obj) {
                if (obj.isMesh) {
                    let material = new THREE.MeshBasicMaterial({ color: "#000000" });
                    let occlusionObject = new THREE.Mesh(obj.geometry, material)
                    //obj.add(axesHelper);
                    occlusionObject.rotation.x =100;
                    occlusionObject.add(new THREE.AxesHelper(100));
                    occlusionObject.layers.set(OCCLUSION_LAYER)
                    if (obj.parent != null) {
                        obj.parent.add(occlusionObject)
                    }

                }
            })
            this.gui.addFolder("Scene Position");
            this.scene.add(gltf.scene);
            
            gltf.scene.position.x = -426;
            gltf.scene.position.y = -78;
            gltf.scene.position.z = 246;
            
/*
            let posX = this.gui.add(gltf.scene.position, "x", -1000, 1000, 1);
            let posY = this.gui.add(gltf.scene.position, "y", -1000, 1000, 1);
            let posZ = this.gui.add(gltf.scene.position, "z", -1000, 1000, 1);
            posX.onChange(x => {
                gltf.scene.position.x = x;  
            })
            posY.onChange(y => {
                gltf.scene.position.y = y;  
            })
            posZ.onChange(z => {
                gltf.scene.position.z = z;  
            })
            */
            
            gltf.scene.rotateOnAxis.x = 100;
            gltf.scene.rotateY = 100;
            gltf.scene.rotateZ = 100

            
        }, function (error) {
            //  console.error( error );
        });

        
        
        this.scene.add(new AxesHelper(10))
        this.camera.position.x = -115;
        this.camera.position.y = -1.2;
        this.camera.position.z = -68;

        this.controls.update();
        this.buildLight(this.scene);
       // this.buildBackGround()

     
    }

    buildLight(){
        //AmbientLight
        this.ambientLight = new THREE.AmbientLight("#2c3e50");
        this.scene.add(this.ambientLight);


        //PointLight
        this.pointLight = new THREE.PointLight("#fffffff");
        this.scene.add(this.pointLight);
        


        let geometry = new THREE.SphereBufferGeometry(80, 320, 320);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.lightSphere = new THREE.Mesh(geometry, material);
        this.lightSphere.layers.set(OCCLUSION_LAYER)
        this.lightSphere.position.z = -700

        this.scene.add(this.lightSphere);

    }

    buildBackGround(){
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
        let xController = this.gui.add(this.lightSphere.position, "x", -1000, 1000, 1);
        let yController = this.gui.add(this.lightSphere.position, "y", -1000, 1000, 1);
        let zController = this.gui.add(this.lightSphere.position, "z", -2000, 2000, 1);



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
    }
}
