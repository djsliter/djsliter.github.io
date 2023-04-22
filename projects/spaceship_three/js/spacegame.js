import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js'

// For menu/state control
let pause = document.getElementById("paused");
let ammoDisplay = document.getElementById("ammo");
let scoreDisplay = document.getElementById("score");
let lifeDisplay = document.getElementById("lives");
let startDisplay = document.getElementById("startgame");
let startgame = document.getElementById("startbutton");
let gameoverDisplay = document.getElementById("gameover");
let header = document.getElementById("controls");
let headerToggle = document.getElementById("toggleControls");
headerToggle.addEventListener("click", () => {
    header.classList.toggle("hide"); 
})
let score = 0;
let lives = 3;

// For controlling animations
let animationID = 0;
let animating = true;
let actionIDs = {
    forwardActionID: 0,
    rotateRightActionID: 0,
    rotateLeftActionID: 0,
    pitchUpActionID: 0,
    pitchDownActionID: 0
}
let escapePressed = false;

// Initialize star-related variables
let stars = [];
let starGroup = new THREE.Group();
let geometry   = new THREE.SphereGeometry(15, 15, 15);
let material = new THREE.MeshBasicMaterial( {color: 0xffffff} );

// Initialize ship-related variables
let pitchAxis = new THREE.Vector3(1, 0, 0);
let rollAxis = new THREE.Vector3(0, 0, 1);
let direction = new THREE.Vector3();
let shipBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

// Initialize projectile-related variables
let projectiles = [];
let projectilesBB = [];
let reloading = false;
let ammo = 5;
let projectileDirections = [];
for(let i = 1; i <= ammo; i++) {
    projectiles[i] = new THREE.Mesh(geometry, material);
    projectiles[i].geometry.computeBoundingSphere();
    projectileDirections[i] = new THREE.Vector3();
    projectilesBB[i] = new THREE.Sphere(projectiles[i].position, 15);
}

// Hold asteroid objects and group for the scene
let asteroids = {};
let asteroidGroup = new THREE.Group();

class Ship {
    constructor(loader) {
       // Load a glTF resource
        loader.load(
            // resource URL
            './models/spaceship/scene.gltf',
            // called when the resource is loaded
            ( gltf ) => {
                // Add model to scene
                scene.add( gltf.scene );
                // Set model scale to match scene
                gltf.scene.scale.set(0.05, 0.05, 0.05);
                // Add camera as a child of the model
                gltf.scene.add( camera );
                // Set camera position behind and slightly above ship
                camera.position.set( 0, 1000, -3000 );
                // Rotate camera to be facing the ship and angle slightly down
                camera.rotation.set(0.2, Math.PI, 0);
                // Provide access to model scene under the ship property
                this.ship = gltf.scene;
                // Initialize ship bounding box
                shipBB.setFromObject(gltf.scene) 
            }
        );   
    }
    // Handle ship rotations
    rotateRight() {
        this.ship.rotateOnAxis(rollAxis, 0.04)
    }
    rotateLeft() {
        this.ship.rotateOnAxis(rollAxis, -0.04)
    }
    pitchUp() {
        this.ship.rotateOnAxis(pitchAxis, -0.04)
    }
    pitchDown() {
        this.ship.rotateOnAxis(pitchAxis, 0.04)
    }
    // Call in each animation frame for slow, continous movement
    drift() {
        this.ship.getWorldDirection(direction)
        starGroup.position.add(direction.multiplyScalar(-1.2))
        asteroidGroup.position.add(direction.multiplyScalar(1.2))
    }
    // Boost ship forward speed above the drift speed
    moveForward() {
        this.ship.getWorldDirection(direction)
        starGroup.position.add(direction.multiplyScalar(-3))
        asteroidGroup.position.add(direction.multiplyScalar(3))
    }
}

class Asteroid {
    constructor (loader) {
        loader.load(
            './models/asteroid/asteroid.glb',
            (gltf) => {
                // Allow access to the model on the asteroid property
                // nested calls to children[0] because of the model strucuture
                this.asteroid = gltf.scene.children[0].children[0].children[0];
                // Call function to create asteroids using this model
                addAsteroids();
            }
        )
    }
}

// Used to add primitives to the scene
const { scene, camera, renderer, ship, asteroid } = init();
// Initializes a group of stars and adds them to the scene
addStars();

startgame.addEventListener("click", () => {
    start();
})

window.addEventListener("keydown", (e) => { 
    // Pause/play the game
    if(e.key == 'Escape') {
        if(!escapePressed) {
            escapePressed = true;
            if(animating) {
                stop(animationID);
            } else {
                start()
            }
            pause.classList.toggle('hide');
        }
    }
    if(animating) {
        // Spacebar moves ship forward at boost speed
        if(e.key === 'Shift') {
            // Interval function is only added once
            if(!actionIDs.forwardActionID) {
                actionIDs.forwardActionID = setInterval(()=> ship.moveForward(), 16);
            }
        }
        // Handle pitch
        if(e.key.toLowerCase() === 'w') {
            if(!actionIDs.pitchDownActionID) {
                // Remove opposite direction interval before setting new one
                clearInterval(actionIDs.pitchUpActionID);
                actionIDs.pitchUpActionID = 0;

                actionIDs.pitchDownActionID = setInterval(() => ship.pitchDown(), 16);
            }
        }
        if(e.key.toLowerCase() === 's') {
            if(!actionIDs.pitchUpActionID) {
                clearInterval(actionIDs.pitchDownActionID);
                actionIDs.pitchDownActionID = 0;

                actionIDs.pitchUpActionID = setInterval(() => ship.pitchUp(), 16);
            }
        }
        // Handle rolling
        if(e.key.toLowerCase() === 'a') {
            if(!actionIDs.rotateLeftActionID) {
                clearInterval(actionIDs.rotateRightActionID);
                actionIDs.rotateRightActionID = 0;

                actionIDs.rotateLeftActionID = setInterval(()=> ship.rotateLeft(), 16);
            }
        } 
        if(e.key.toLowerCase() === 'd') {
            if(!actionIDs.rotateRightActionID) {
                clearInterval(actionIDs.rotateLeftActionID);
                actionIDs.rotateLeftActionID = 0;

                actionIDs.rotateRightActionID = setInterval(()=> ship.rotateRight(), 16);
            }
        }
        // Fire projectiles
        if(e.key === ' ') {
            // Check ammo count before "firing" projectile
            if(ammo > 0) {
                // Set the position of a projectile to the origin
                projectiles[ammo].position.set(0, 0, 0)
                // Get the current direction vector of the ship and associate
                // with the current projectile index
                ship.ship.getWorldDirection(projectileDirections[ammo])
                // Add the projectile to the scene
                scene.add(projectiles[ammo])
                // Removes projectile after 2 seconds
                despawnProjectile(ammo)
                // Decrement current ammo/magazine count
                ammo--;
                ammoDisplay.textContent = "Ammo: " + ammo;
                // If ammo has hit 0, execute a "reload", which sets ammo back to
                // 5 after a 1 second delay
                if(ammo == 0) reload()
            }
        }
    }
})
// Clear corresponding intervals for each key on keyup
window.addEventListener("keyup", (e) => {
    // Pause/play the game
    if(e.key == 'Escape') {
        escapePressed = false;
    }
    if(e.key === 'Shift') {
        clearInterval(actionIDs.forwardActionID);
        actionIDs.forwardActionID = 0;
    }
    if(e.key.toLowerCase() === 'w') {
        clearInterval(actionIDs.pitchDownActionID);
        actionIDs.pitchDownActionID = 0;
    }
    if(e.key.toLowerCase() === 's') {
        clearInterval(actionIDs.pitchUpActionID);
        actionIDs.pitchUpActionID = 0;
    }
    if(e.key.toLowerCase() === 'a') {
        clearInterval(actionIDs.rotateLeftActionID);
        actionIDs.rotateLeftActionID = 0;
    }
    if(e.key .toLowerCase()=== 'd') {
        clearInterval(actionIDs.rotateRightActionID);
        actionIDs.rotateRightActionID = 0;
    }
})
// Reshape scene and render for different window sizes
window.addEventListener('resize', 
    () => {
        camera.aspect = window.innerWidth / window.innerHeight ;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight - 150)
    }, 
    false
)

// Initialize scene parameters and objects
function init() {
    const scene = new THREE.Scene();

    // Instantiate loaders for ship and asteroid
    const shipLoader = new GLTFLoader();
    const asteroidLoader = new GLTFLoader();
    
    // Defines the camera view: FOV, aspect ratio, near, far clipping planes
    const camera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight,
        0.1, 100000
    );

    // Instantiate the renderer object
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight - 150);
    renderer.setClearColor( 0x000, 1)
    document.body.appendChild(renderer.domElement);

    // Add ambient light for the assets
    // NOTE: the asteroid model is extremely dark, even with intense light
    // and the ship model is blown out by the light. Not sure why
    const light = new THREE.AmbientLight( 0xafafaf, 24 );
    scene.add( light );

    // Initialize ship and asteroid models
    const ship = new Ship(shipLoader);
    const asteroid = new Asteroid(asteroidLoader);
    
    // Add scene and camera to renderer
    renderer.render( scene, camera );

    return { scene, camera, renderer, ship, asteroid };
}

function addStars() { 
    for ( let i = 0; i < 2000; i ++ ) {
        // Make a sphere representing a star
        let geometry   = new THREE.SphereGeometry(3, 15, 15);
        let material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        let sphere = new THREE.Mesh(geometry, material)

        // Initialize each star to a random position from -5000 to 5000
        sphere.position.set(
            Math.random() * 10000 - 5000,
            Math.random() * 10000 - 5000,
            Math.random() * 10000 - 5000
        );
        // Add star to group for the scene
        starGroup.add(sphere);
        // Also add to an array, which I tried to use to remove/re-add stars
        // to the group to create an infinite field, but couldn't get it working
        stars.push( sphere );
    }
    // Add created group to the scene
    scene.add(starGroup)
}

function addAsteroids() {
    
    for(let i = 0; i < 1000; i++) {
        // Create asteroid from geometry and material of loaded asteroid model
        let spawnAsteroid = new THREE.Mesh( asteroid.asteroid.geometry, asteroid.asteroid.material );
        // Create placeholder for bounding box
        let asteroidBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

        // Set random scale, random position, and random rotation
        let scale = Math.random() * 120 + 20;
        spawnAsteroid.scale.set(scale, scale, scale);
        spawnAsteroid.position.set(
            Math.random() * 9000 - 4500, 
            Math.random() * 9000 - 4500, 
            Math.random() * 9000 - 4500
        );
        spawnAsteroid.rotation.set(
            Math.random() * 2 * Math.PI - (2*Math.PI), 
            Math.random() * 2 * Math.PI - (2*Math.PI),
            Math.random() * 2 * Math.PI - (2*Math.PI)
        );
        // Set bounding box for the asteroid
        asteroidBB.setFromObject(spawnAsteroid)
        
        // Map current asteroid id to its mesh and bounding box in array
        asteroids[spawnAsteroid.uuid] = {
            mesh: spawnAsteroid,
            boundingBox: asteroidBB
        }
        // Add asteroid to group
        asteroidGroup.add(spawnAsteroid)
    }
    // Add group to scene
    scene.add(asteroidGroup)
}
// Handle projectile "reload". Delay for 1 second, then reset ammo count
function reload() {
    // Avoid calling reload before completion
    if(!reloading) {
        reloading = true
        setTimeout(() => {
            ammo = 5;
            ammoDisplay.textContent = "Ammo: " + ammo;
            reloading = false
        }, 1000)
    }
}
// Remove projectile from scene after 2 seconds
function despawnProjectile(index) {
    setTimeout(() => {
        scene.remove(projectiles[index])
    }, 2000)
}

function animate() {
    // Move ship forward at steady, slow speed
    ship.drift();

    // Update ship bounding box each frame to account for orientation
    shipBB.setFromObject(ship.ship);

    // Check for asteroid collisions with ship or projectiles
    for(let key in asteroids) {
        let asteroid = asteroids[key]
        // No need to perform checks for asteroids no longer in the group
        if(asteroid.mesh.parent === asteroidGroup) {
            // Update asteroid bounding box before checking collisions
            asteroid.boundingBox.setFromObject(asteroid.mesh)
            if(shipBB.intersectsBox(asteroid.boundingBox)) {
                // Remove collided asteroid from group
                asteroidGroup.remove(asteroid.mesh);
                // Call stop() function to pause animation
                stop(animationID);
                // Alert user of death and check if they'd like to continue
                animating = updateLives();
                // Clear all intervals and reinitialize to zeroes
                for(let action in actionIDs) {
                    clearInterval(actionIDs[action]);
                    actionIDs[action] = 0;
                }
            }
            // Check if projectiles collide with any asteroid
            for(let i = 1; i < projectiles.length; i++) {
                if(projectiles[i].parent === scene) {
                    if(asteroid.boundingBox.intersectsSphere(projectilesBB[i])) {
                        updateScore();
                        // Remove collided asteroid from group
                        asteroidGroup.remove(asteroid.mesh);
                        // Remove projectile from the scene
                        scene.remove(projectiles[i])
                    }
                }
            }
        }
    }
    // Animate projectile direction and speed
    for(let i = projectiles.length - 1; i > 0; i--) {
        // Only need to animate what's attached to the scene
        if(projectiles[i].parent === scene) {
            projectiles[i].position.add(projectileDirections[i].multiplyScalar(1.07))
        }
    } 
    // Scene and animation control
    if(animating) {
        renderer.render( scene, camera );
        animationID = requestAnimationFrame( animate );
    }
}
// Increment score
function updateScore() {
    score += 1;
    scoreDisplay.textContent = "Score: " + score;
}
// Check if lives left. If not, game over. Else, decrement lives and continue.
function updateLives() {
    if(lives <= 0) {
        // Remove ship from scene, could add explosion effect in future
        scene.remove(ship.ship);
        // Update renderer to show removed ship
        renderer.render( scene, camera );
        // Display game over header
        gameoverDisplay.classList.toggle("hide");
        // Wait a short bit, then remove gameover and show start game again
        setTimeout(() => {
            // FUTURE: call restartGame() function
            score = 0;
            scoreDisplay.textContent = "Score: " + score;
            lives = 3;
            lifeDisplay.textContent = "Lives: " + lives;
            ammo = 5;
            ammoDisplay.textContent = "Ammo: " + ammo;
            
            gameoverDisplay.classList.toggle("hide");
            startDisplay.classList.remove("hide");
            // Add ship back to scene
            scene.add(ship.ship)
        }, 1500);
        return false   
    }
    // If the game is not over, decrement lives, update display, and return
    // true for the value of animating
    lives -= 1;
    lifeDisplay.textContent = "LIVES: " + lives;  
    return true;
}
// Pause animation of the game
function stop(animationID) {
    animating = false;
    cancelAnimationFrame(animationID);
}
// Start animating the game, hide start game button
function start() {
    startDisplay.classList.add("hide");
    animating = true;
    requestAnimationFrame( animate );
}