import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js'

let stars = []
let pitchAxis = new THREE.Vector3(1, 0, 0);
let rollAxis = new THREE.Vector3(0, 0, 1);
let direction = new THREE.Vector3();

class Ship {
    constructor(loader) {
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
    }
    rotateLeft() {
        this.ship.rotateOnAxis(rollAxis, -0.04)
    }
    moveForward() {
        this.ship.getWorldDirection(direction);
        camera.position.x = this.ship.position.x
        camera.position.y = this.ship.position.y
        camera.position.z = this.ship.position.z + 700
        camera.lookAt(this.ship.position)
        this.ship.position.add(direction.multiplyScalar(10.0))
    }
    pitchUp() {
        this.ship.rotateOnAxis(pitchAxis, -0.04)
    }
    pitchDown() {
        this.ship.rotateOnAxis(pitchAxis, 0.04)
    }
    drift() {
        this.ship.getWorldDirection(direction);
        camera.position.x = this.ship.position.x
        camera.position.y = this.ship.position.y
        camera.position.z = this.ship.position.z + 700
        camera.lookAt(this.ship.position)
        this.ship.position.add(direction.multiplyScalar(3.0))
    }
}

// Used to add primitives to the scene
const { scene, camera, renderer, loader, ship } = init();


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
    setTimeout(animate, 500)
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
    renderer.setSize(window.innerWidth - 100, window.innerHeight - 200);
    document.body.appendChild(renderer.domElement);
    
    renderer.setClearColor( 0x000, 1)

    const light = new THREE.AmbientLight( 0xffffff, 3 ); // soft white light
    scene.add( light );

    camera.position.z = 700;
    camera.position.x = 0;
    camera.position.y = 0;

    var ship = new Ship(loader);
    renderer.render( scene, camera );

    return { scene, camera, renderer, loader, ship };
}

function addSphere(){

    // The loop will move from z position of -1000 to z position 1000, adding a random particle at each position. 
    for ( let i = -10000; i < 10000; i += 20 ) {

        // Make a sphere (exactly the same as before). 
        var geometry   = new THREE.SphereGeometry(0.5, 32, 32)
        var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        var sphere = new THREE.Mesh(geometry, material)

        // This time we give the sphere random x and y positions between -500 and 500
        sphere.position.x = Math.random() * 10000 - 5000;
        sphere.position.y = Math.random() * 10000 - 5000;

        // Then set the z position to where it is in the loop (distance of camera)
        sphere.position.z = i;

        // scale it up a bit
        sphere.scale.x = sphere.scale.y = 5;

        //add the sphere to the scene
        scene.add( sphere );

        //finally push it to the stars array 
        stars.push(sphere); 
    }
}

function animate() {
    ship.drift()
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
addSphere();