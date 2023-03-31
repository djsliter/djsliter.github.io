var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 10 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var drone, sky;
var upKey, downKey, leftKey, rightKey;

function preload ()
{
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/clouds.png');
    this.load.image('smoke', 'http://labs.phaser.io/assets/particles/smoke-puff.png');
    this.load.spritesheet('drone', 'resources/1 Drones/4/Walk.png', { frameWidth: 96, frameHeight:70, endFrame: 4 });
}

function create ()
{
   var config = {
        key: 'fly',
        frames: this.anims.generateFrameNumbers('drone', { start: 0, end: 3, first: 0 }),
        frameRate: 10,
        repeat: -1
    };

    this.anims.create(config);

    sky = this.add.image(400, 300, 'sky');
    var particles = this.add.particles('smoke');
    drone = this.add.sprite(200, 100, 'drone').play('fly');

    var emitter = particles.createEmitter({
        speed: 20,
        scale: { start: 0.07, end:0.07 },
        blendMode: 'ADD'
    });
    
    drone.flipX = false;

    emitter.startFollow(drone);

    upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
}

function update() {
    if(drone.y > 25) {
        if(upKey.isDown) { 
            drone.y -= 1.5;
        }
    }
    if(drone.y < game.config.height - 25) {
        drone.y += 0.3;
        if(downKey.isDown) { 
            if(leftKey.isDown || rightKey.isDown) {
                drone.y += 1;
            } else {
                drone.y += 1.5;
            } 
        }
    }
    if(drone.x > 25) {
        if(leftKey.isDown) { 
            if(upKey.isDown || downKey.isDown) {
                drone.x -= 1;
            } else {
                drone.x -= 1.5;
            }
    
            drone.flipX = true;
        }
    }
    if(drone.x < game.config.width - 25) {
        if(rightKey.isDown) { 
            if(upKey.isDown || downKey.isDown) {
                drone.x += 1;
            } else {
                drone.x += 1.5;
            }
            drone.flipX = false;
        }
    }
}