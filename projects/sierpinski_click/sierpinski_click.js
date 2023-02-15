"use strict";

var canvas;
var gl;
var coords =  [ [-1 , -1] , [0 , 1] , [1 , -1]];
 
var mouseDown = false;
var closestVertex = 0;

var points = [];

var numTimesToSubdivide = 0;

function init()
{
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    var rect = gl.canvas.getBoundingClientRect();

    canvas.addEventListener("mousedown", (e) => {
        // Calculate closest vertex
        var dist = 100;
        var currDist;
        var x = (e.clientX - rect.left) / canvas.width * 2 - 1;
        var y = (e.clientY - rect.top) / canvas.height * -2 + 1;
        
        for(let i = 0; i < coords.length; i++) {
            var x2 = Math.pow((coords[i][0] - x), 2);
            var y2 = Math.pow((coords[i][1] - y), 2);
            var sum = x2 + y2;

            var currDist = Math.sqrt(sum);
            
            if (currDist < dist) {
                dist = currDist;
                closestVertex = i;
            }
        } 
        
        mouseDown = true;
    });
    canvas.addEventListener("mouseup", (e) => {
        mouseDown = false;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (mouseDown == true) {
            var newx = (e.clientX - rect.left) / canvas.width * 2 - 1;
            var newy = (e.clientY - rect.top) / canvas.height * -2 + 1;

            if (closestVertex == 0) {
                coords[0][0] = newx;
                coords[0][1] = newy;
            } else if (closestVertex == 1) {
                coords[1][0] = newx;
                coords[1][1] = newy;
            } else {
                coords[2][0] = newx;
                coords[2][1] = newy;
            }
        }
    });
    // First, initialize the corners of our gasket with three points.
    var vertices = [
        vec2( coords[0][0], coords[0][1] ),
        vec2( coords[1][0], coords[1][1] ),
        vec2( coords[2][0], coords[2][1] )
    ];

    divideTriangle( vertices[0], vertices[1], vertices[2],
                    numTimesToSubdivide);

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 50000, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    document.getElementById("slider").onchange = function(event) {
        numTimesToSubdivide = parseInt(event.target.value);
    };
    

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        triangle( a, b, c );
    } else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles
        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

window.onload = init;

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    points = [];
    requestAnimFrame(init);
}
