import testfile from "../models/scene.gltf";
import * as THREE from 'three';
import {
    AmbientLight,
    AxesHelper,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PointLight,
    SphereBufferGeometry
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DEFAULT_LAYER, loader, OCCLUSION_LAYER, renderer, updateShaderLightPosition } from "./index";
import { AbstractScene } from "./AbstractScene";


export class FirstScene extends AbstractScene {

    constructor() {
        super();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.pointLight = undefined;
        this.lightSphere = undefined;
        this.buildScene();
        [this.occlusionComposer, this.sceneComposer] = this.composeEffects();
        this.buildGUI();
    }


    render() {
        this.controls.update();

        this.camera.layers.set(OCCLUSION_LAYER);
        renderer.setClearColor("#111111")

        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        renderer.setClearColor("#030509");

        this.sceneComposer.render();
    }

    buildScene(){
        loader.load(testfile, function ( gltf ) {
            gltf.scene.traverse( function (obj) {
                if(obj.isMesh){
                    let material = new THREE.MeshBasicMaterial({color: "#000000"});
                    let occlusionObject = new THREE.Mesh(obj.geometry, material)
                    obj.add(axesHelper);
                    occlusionObject.add(new THREE.AxesHelper(100));
                    occlusionObject.layers.set(OCCLUSION_LAYER)
                    if (obj.parent != null){
                        obj.parent.add(occlusionObject)
                    }
           
                }
            })
    
            this.scene.add(gltf.scene);
            gltf.scene.position.x = 3;
            gltf.scene.position.y = -0.5;
            gltf.scene.position.z = 5;
            gltf.scene.visible = true;
    
                
        }, function ( error ) {
            // console.error( error );
        } );
       
    
        this.camera.position.z = 200;
        controls.update();
    }
    

    buildGUI() {
        let shaderUniforms = occlusionComposer.passes[1].uniforms;

        gui.addFolder("Light Position");
        let xController = gui.add(lightSphere.position, "x", -10, 10, 0.01);
        let yController = gui.add(lightSphere.position, "y", -10, 10, 0.01);
        let zController = gui.add(lightSphere.position, "z", -20, 20, 0.01);

        controls.addEventListener("change", () => updateShaderLightPosition(lightSphere))

        xController.onChange(x => {
            pointLight.position.x = x;
            updateShaderLightPosition(lightSphere);

        })
        yController.onChange(y => {
            pointLight.position.y = y;
            updateShaderLightPosition(lightSphere);

        })
        zController.onChange(z => {
            pointLight.position.z = z;
            updateShaderLightPosition(lightSphere);
        })



        gui.addFolder("Volumetric scattering parameters");
        // Object.keys(shaderUniforms).forEach((k) => {
        //     if (k != "tDiffuse" && k != "lightPosition") {
        //         let prop = shaderUniforms[k]
        //         switch (k) {
        //             case "weight":
        //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
        //                 break;
        //             case "exposure":
        //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
        //                 break;
        //             case "decay":
        //                 gui.add(prop, "value", 0.8, 1, 0.001).name(k);
        //                 break;
        //             case "density":
        //                 gui.add(prop, "value", 0, 1, 0.01).name(k);
        //                 break;
        //             case "samples":
        //                 gui.add(prop, "value", 0, 200, 1).name(k);
        //                 break;
        //         }
        //     }
        // })
        gui.add(shaderUniforms.weight, "value", 0, 1, 0.01).name('Weight');
        gui.add(shaderUniforms.exposure, "value", 0, 1, 0.01).name("Exposure");
        gui.add(shaderUniforms.decay, "value", 0.8, 1, 0.001).name("Decay");
        gui.add(shaderUniforms.density, "value", 0, 1, 0.01).name("Density");
        gui.add(shaderUniforms.samples, "value", 0, 200, 1).name("Samples");
    }
}
