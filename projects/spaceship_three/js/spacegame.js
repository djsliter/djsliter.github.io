import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js'

let animationID = 0
let geometry   = new THREE.SphereGeometry(15, 15, 15)
let material = new THREE.MeshBasicMaterial( {color: 0xffffff} );

let stars = []
let starGroup = new THREE.Group()
let pitchAxis = new THREE.Vector3(1, 0, 0);
let rollAxis = new THREE.Vector3(0, 0, 1);
let direction = new THREE.Vector3();

let shipBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3())

let projectiles = []
let projectilesBB = []
let reloading = false;
let ammo = 5;
let projectileDirections = [];
for(let i = 1; i <= ammo; i++) {
    projectiles[i] = new THREE.Mesh(geometry, material)
    projectiles[i].geometry.computeBoundingSphere()
    projectileDirections[i] = new THREE.Vector3();
    projectilesBB[i] = new THREE.Sphere(projectiles[i].position, 15)
}


let asteroids = {}
let asteroidGroup = new THREE.Group()
let asteroidBBs = []

class Ship {
    constructor(loader) {
       // Load a glTF resource
        loader.load(
            // resource URL
            './models/spaceship/scene.gltf',
            // called when the resource is loaded
            ( gltf ) => {
                scene.add( gltf.scene );
                gltf.scene.scale.set(0.05, 0.05, 0.05)
                gltf.scene.rotation.set(0.0, 3.14, 0);
                gltf.scene.add( camera )
                camera.lookAt(gltf.scene)
                camera.position.set( 0, 1000, -3000 );
                camera.rotation.set(0.2, Math.PI, 0)
                this.ship = gltf.scene;
                shipBB.setFromObject(gltf.scene)
                
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
        this.ship.getWorldDirection(direction)
        starGroup.position.add(direction.multiplyScalar(-1.5))
        asteroidGroup.position.add(direction.multiplyScalar(1.5))
    }
    pitchUp() {
        this.ship.rotateOnAxis(pitchAxis, -0.04)
    }
    pitchDown() {
        this.ship.rotateOnAxis(pitchAxis, 0.04)
    }
    drift() {
        this.ship.getWorldDirection(direction)
        starGroup.position.add(direction.multiplyScalar(-1.2))
        asteroidGroup.position.add(direction.multiplyScalar(1.2))
    }
}

class Asteroid {
    constructor (loader) {
        loader.load(
            './models/asteroid/asteroid.glb',
            (gltf) => {
                
                console.log(gltf.scene)
                gltf.scene.scale.set(20, 20, 20)
                gltf.scene.rotation.set(
                    Math.random() * 2 * Math.PI - (2*Math.PI), 
                    Math.random() * 2 * Math.PI - (2*Math.PI),
                    Math.random() * 2 * Math.PI - (2*Math.PI)
                );
                gltf.scene.position.set(0, 10, -100)
                this.asteroid = gltf.scene.children[0].children[0].children[0];
                
                setTimeout(addAsteroids, 1000);
                
            }
        )
    }
}


// Used to add primitives to the scene
const { scene, camera, renderer, ship, asteroid } = init();
addSphere();
scene.add(starGroup)

var forwardActionID;
var rotationActionID;
var verticalActionID;


window.addEventListener("mousedown", (e)=> {
    if(ammo > 0) {
        projectiles[ammo].position.set(0, 0, 0)

        ship.ship.getWorldDirection(projectileDirections[ammo])
        
        scene.add(projectiles[ammo])

        despawnProjectile(ammo)

        ammo--;
        if(ammo == 0) reload()
    } 
})

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
setTimeout(animate, 1000)


function init() {
    const scene = new THREE.Scene();
    // Instantiate a loader
    const loader = new GLTFLoader();
    const loader2 = new GLTFLoader();
    
    
    const axesHelper = new THREE.AxesHelper( 150 );
    scene.add( axesHelper );
    // Defines the camera view: FOV, aspect ratio, near, far clipping planes
    const camera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight,
        0.1, 100000
    );

    // Instantiate the renderer object
    const renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth - 100, window.innerHeight - 200);
    renderer.setClearColor( 0x000, 1)
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight( 0xafadaf, 15 ); // soft white light
    scene.add( light );

    const ship = new Ship(loader);
    const asteroid = new Asteroid(loader2)
    
    
    renderer.render( scene, camera );

    return { scene, camera, renderer, ship, asteroid };
}

function addSphere(){

    // The loop will move from z position of -1000 to z position 1000, adding a random particle at each position. 
    for ( let i = 0; i < 1000; i ++ ) {

        // Make a sphere (exactly the same as before). 
        let geometry   = new THREE.SphereGeometry(0.5, 32, 32)
        let material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        let sphere = new THREE.Mesh(geometry, material)

        // This time we give the sphere random x and y positions between -500 and 500
        sphere.position.x = Math.random() * 10000 - 5000;
        sphere.position.y = Math.random() * 10000 - 5000;

        // Then set the z position to where it is in the loop (distance of camera)
        sphere.position.z = Math.random() * 10000 - 5000;
        // scale it up a bit
        sphere.scale.x = sphere.scale.y = 8;
        if(i == 0) {
            sphere.scale.x = sphere.scale.y = 100;
        }

        starGroup.add(sphere)
        stars.push( sphere );
    }
    
}

function addAsteroids() {
    
    for(let i = 0; i < 200; i++) {
        let spawnAsteroid = new THREE.Mesh( asteroid.asteroid.geometry, asteroid.asteroid.material )
        let asteroidBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3())

        spawnAsteroid.scale.set(40,40,40)
        spawnAsteroid.position.set(Math.random() * 5000 - 2500, Math.random() * 5000 - 2500, Math.random() * 5000 - 2500)
        spawnAsteroid.rotation.set(
            Math.random() * 2 * Math.PI - (2*Math.PI), 
            Math.random() * 2 * Math.PI - (2*Math.PI),
            Math.random() * 2 * Math.PI - (2*Math.PI)
        );
        asteroidBB.setFromObject(spawnAsteroid)
        spawnAsteroid.geometry.computeBoundingSphere()

        asteroids[spawnAsteroid.uuid] = {
            mesh: spawnAsteroid,
            boundingBox: asteroidBB
        }
        
        asteroidGroup.add(spawnAsteroid)
    }
    scene.add(asteroidGroup)
}

function reload() {
    if(!reloading) {
        reloading = true
        setTimeout(() => {
            ammo = 5;
            reloading = false
        }, 1000)
    }
}

function despawnProjectile(index) {
    setTimeout(() => {
        scene.remove(projectiles[index])
    }, 2000)
}

function despawnAsteroid(id) {

}

function animate() {
    // ship.drift()

    shipBB.setFromObject(ship.ship)
    for(let key in asteroids) {
        let asteroid = asteroids[key]
        
        asteroid.boundingBox.setFromObject(asteroid.mesh)
        if(shipBB.intersectsBox(asteroid.boundingBox)) {
            console.log("SHIP COLLISION")
        }
        for(let i = 1; i < projectiles.length; i++) {
            if(asteroid.boundingBox.intersectsSphere(projectilesBB[i])) {
                console.log(asteroid)
                asteroidGroup.remove(asteroid.mesh)
            }
  
        }
    }
    
    for(let i = projectiles.length - 1; i > 0; i--) {
        if(projectiles[i]) {
            projectiles[i].position.add(projectileDirections[i].multiplyScalar(1.05))
            // projectilesBB[i].copy(projectiles[i].geometry.boundingSphere).applyMatrix4(projectiles[i].matrixWorld);
        }
       
    }
    
    renderer.render( scene, camera );
    animationID = requestAnimationFrame( animate );
}
function stop(animationID) {
    
    window.cancelAnimationFrame(animationID)
}