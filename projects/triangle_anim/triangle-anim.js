var gl;
var points;
var x  = 0.0;
var y = 0.0;
var xLoc, yLoc;
var xDir, yDir;
xDir = 1.0;
yDir = 1.0;
// left, right, up, down
var dirs = {
    "left": false, 
    "right": false, 
    "up": false, 
    "down": false,
    "boost": false
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

window.onload = function init() {
    var canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    var rect = gl.canvas.getBoundingClientRect();
   
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
            } else if (e.key == "Shift") {
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
            } else if (e.key == "Shift") {
                dirs.boost = false;
            } 
        }, 
        false
    );
    canvas.addEventListener(
        "click",
        (e) => {
            // Convert coords
            
            x = (-1 + 2*(e.clientX - rect.left)/canvas.width);
            y = -1*(-1 + 2*(e.clientY- rect.top)/canvas.height);
            
        }
        
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

    // Resize
    for(let i = 0; i < vertices.length; i++) {
        vertices[i] = scale(0.25, vertices[i]);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    // Link uniform x,y vars from vertex shader to gl program
    // These represent the x,y coords of the object we render
    xLoc = gl.getUniformLocation(program, "x");
    yLoc = gl.getUniformLocation(program, "y");

    
    var bufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    
    render();
};

function render() {
    
    x += 0.05 * xDir;
    y += 0.1 * yDir;
    
    if (y > 0.9) { // top hit -- reverse y but keep x
        y = 0.9;
        yDir *= -1.0;
    }
    if (x > 0.9) { // right hit -- reverse x but keep y
        x = 0.9;
        xDir *= -1.0;
    }
    if (y < -0.9) { // bottom hit -- reverse y but keep x
        y = -0.9;
        yDir *= -1.0;
    }
    if (x < -0.9) { // left hit -- reverse x but keep y
        x = -0.9;
        xDir *= -1.0;
    } 

    // Update uniform attribute values
    gl.uniform1f(xLoc, x);
    gl.uniform1f(yLoc, y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    window.requestAnimationFrame(render);
};