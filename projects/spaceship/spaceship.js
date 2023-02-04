var gl;
var points;
var x  = 0.0;
var y = 0.0;
var xLoc, yLoc;
var rLoc;
var rotation = [0, 1];
var angle = 90;
var direction;
var speed = 0.003;
var boostSpeed = 0.005;
// left, right, up, down
var dirs = {
    "left": false, 
    "right": false, 
    "up": false, 
    "down": false,
    "boost": false
}

function newXYForAngle(angleInDegrees) {
    var angleInRadians = angleInDegrees * Math.PI / 180;
    var y = Math.sin(angleInRadians);
    var x = Math.cos(angleInRadians);
    return [x, y];
  }

window.onload = function init() {
    var canvas = document.getElementById('gl-canvas');
    
    window.addEventListener("resize", function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    gl = WebGLUtils.setupWebGL(canvas);
   
    window.addEventListener(
        "keydown", 
        (e) => {
            // Choose direction to move if key is pressed down
            if (e.key == "ArrowLeft" || e.key == "a") {
                dirs.right = false;
                dirs.left = true;
            } else if (e.key == "ArrowRight" || e.key == "d") {
                dirs.left = false;
                dirs.right = true;
            } else if (e.key == "ArrowUp" || e.key == "w") {
                dirs.down = false;
                dirs.up = true;
            } else if (e.key == "ArrowDown" || e.key == "s") {
                dirs.up = false;
                dirs.down = true;
            } else if (e.key == " ") {
                dirs.boost = true;
            }
               
        }, 
        false
    );
    window.addEventListener(
        "keyup", 
        (e) => {
            // Stop moving in corresponding direction if key is let up
            if (e.key == "ArrowLeft" || e.key == "a") {
                dirs.left = false;
            } else if (e.key == "ArrowRight" || e.key == "d") {
                dirs.right = false;
            } else if (e.key == "ArrowUp" || e.key == "w") {
                dirs.up = false;
            } else if (e.key == "ArrowDown" || e.key == "s") {
                dirs.down = false;
            } else if (e.key == " ") {
                dirs.boost = false;
            } 
        }, 
        false
    );
       
    
    if (!gl) alert('WebGL unavailable');

    var vertices = [
        vec2(0.0, 0.5),
        vec2(-0.25, 0.0),
        vec2(0.25, 0.0),
        vec2(0.0, 0.5),
        vec2(-0.25, -0.25),
        vec2(0.25, -0.25),
        vec2(0.0, 0.5)
    ]
    // Didn't feel like manually resizing
    for(let i = 0; i < vertices.length; i++) {
        vertices[i] = scale(0.25, vertices[i]);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    // Link uniform x,y vars from vertex shader to gl program
    // These represent the x,y coords of the object we render
    xLoc = gl.getUniformLocation(program, "x");
    yLoc = gl.getUniformLocation(program, "y");
    rLoc = gl.getUniformLocation(program, "u_rotation");

    var bufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    

    var vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};

function render() {
    
    direction = newXYForAngle(angle);
    
    if (dirs.right) { // rotate right
        angle = angle - 2;
        rotation = newXYForAngle(angle);
    } else if (dirs.left) { // rotate left
        angle = angle + 2;
        rotation = newXYForAngle(angle);
    }
    if (dirs.up) { // Move in direction object is pointed
        y += direction[1] * (dirs.boost ? boostSpeed : speed);
        x += direction[0] * (dirs.boost ? boostSpeed : speed);
    } else if (dirs.down) { // move down
        y -= direction[1] * speed;
        x -= direction[0] * speed;
    }
    // Update uniform attribute values
    gl.uniform1f(xLoc, x);
    gl.uniform1f(yLoc, y);
    gl.uniform2f(rLoc, rotation[0], rotation[1]);

    // gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    window.requestAnimationFrame(render);
};