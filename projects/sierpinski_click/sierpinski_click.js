"use strict";

var canvas;
var gl;

var x1 = -1;
var x2 = 0;
var x3 = 1;
var y1 = -1;
var y2 = 1;
var y3 = -1;

var points = [];

var numTimesToSubdivide = 0;

function init()
{
    canvas = document.getElementById( "gl-canvas" );
    canvas.addEventListener("mouseup", function(event) {
        var rect = gl.canvas.getBoundingClientRect();
        var newx = (event.clientX - rect.left) / canvas.width * 2 - 1;
        var newy = (event.clientY - rect.top) / canvas.height * -2 + 1;
        
        var vertex_id = document.querySelector('input[name="vertex"]:checked').value;
        if (vertex_id == 0) {
            x1 = newx;
            y1 = newy;
        } else if (vertex_id == 1) {
            x2 = newx;
            y2 = newy;
        } else {
            x3 = newx;
            y3 = newy;
        }


        console.log(newx, newy);
    });

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // First, initialize the corners of our gasket with three points.
    var vertices = [
        vec2( x1, y1 ),
        vec2( x2, y2 ),
        vec2( x3, y3 )
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
