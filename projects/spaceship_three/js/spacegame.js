import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js'

var dx = 0.0;
var dy = 0.0;
var dz = 0.0;
var x, y, z;
let pitchAxis = new THREE.Vector3(1, 0, 0);
let rollAxis = new THREE.Vector3(0, 0, 1);

class Ship {
    constructor() {
       // Load a glTF resource
        loader.load(
            // resource URL
            './models/scene.gltf',
            // called when the resource is loaded
            ( gltf ) => {
                scene.add( gltf.scene );
                gltf.scene.scale.set(0.25, 0.25, 0.25)
                gltf.scene.rotation.set(0.0, 3.14, 0);
                this.ship = gltf.scene;
                
            }

        ); 
    }
    rotateRight() {
        this.ship.rotateOnAxis(rollAxis, 0.04)
        camera.rotateOnAxis(rollAxis, -0.04)
    }
    rotateLeft() {
        this.ship.rotateOnAxis(rollAxis, -0.04)
        camera.rotateOnAxis(rollAxis, 0.04)
    }
    moveForward() {
        let direction = new THREE.Vector3();
        this.ship.getWorldDirection(direction);
        camera.position.z = this.ship.position.z + 700
        camera.lookAt(this.ship.position)
        this.ship.position.add(direction.multiplyScalar(10.0))
    }
    pitchUp() {
        camera.rotateOnAxis(pitchAxis, 0.04)
        
        this.ship.rotateOnAxis(pitchAxis, -0.04)
    }
    pitchDown() {
        camera.rotateOnAxis(pitchAxis, -0.04)
        console.log(this.ship.position)
        this.ship.rotateOnAxis(pitchAxis, 0.04)
    }
}

// Used to add primitives to the scene
const { scene, camera, renderer, loader, light } = init();
var ship = new Ship();

var forwardActionID;
var rotationActionID;
var verticalActionID;

window.onload = () => {
    
    window.addEventListener("keypress", (e) => { 
        if(e.key === ' ') {
            if(!forwardActionID) {
                forwardActionID = setInterval(()=> ship.moveForward(), 16);
            }
        }
        if(e.key === 'w') {
            if(!verticalActionID) {
                verticalActionID = setInterval(() => ship.pitchDown(), 16);
            }
        }
        if(e.key === 's') {
            if(!verticalActionID) {
                verticalActionID = setInterval(() => ship.pitchUp(), 16);
            }
        }
        if(e.key === 'a') {
            if(!rotationActionID) {
                rotationActionID = setInterval(()=> ship.rotateLeft(), 16);
            }
        }
        if(e.key === 'd') {
            if(!rotationActionID) {
                rotationActionID = setInterval(()=> ship.rotateRight(), 16);
            }
        }
        
    })
    window.addEventListener("keyup", (e) => {
        if(e.key === ' ') {
            clearInterval(forwardActionID);
            forwardActionID = 0;
        }
        if(e.key === 'w' || e.key === 's') {
            clearInterval(verticalActionID);
            verticalActionID = 0;
        }
        if(e.key === 'a' || e.key === 'd') {
            clearInterval(rotationActionID);
            rotationActionID = 0;
        }
    })
    window.addEventListener('resize', 
        () => {
            camera.aspect = window.innerWidth / window.innerHeight ;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight )
        }, 
        false
    )
}

function init() {
    const scene = new THREE.Scene();
    // Instantiate a loader
    const loader = new GLTFLoader();
    const axesHelper = new THREE.AxesHelper( 150 );
    scene.add( axesHelper );
    // Defines the camera view: FOV, aspect ratio, near, far clipping planes
    const camera = new THREE.PerspectiveCamera(
        60, window.innerWidth / window.innerHeight,
        0.1, 10000
    );

    // Instantiate the renderer object
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    renderer.setClearColor( 0x306090, 1)

    const light = new THREE.AmbientLight( 0xffffff, 3 ); // soft white light
    scene.add( light );

    camera.position.z = 500;
    camera.position.x = 0;
    camera.position.y = 0;

    return { scene, camera, renderer, loader, light };
}

function animate() {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
}
animate();