// Wait until the window is loaded
window.onload = function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize the shaders using initShaders.js
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Define the vertices for three points
    var vertices = new Float32Array([
        0.0, 0.0,  // First point (x, y)
        1.0, 0.0,  // Second point (x, y)
        1.0, 1.0   // Third point (x, y)
    ]);

    // Create a buffer object
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Load the vertex data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Get the location of the attribute 'a_Position' in the vertex shader
    var a_Position = gl.getAttribLocation(program, "a_Position");

    // Point the attribute to the currently bound buffer
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the attribute so it can be used in the shader
    gl.enableVertexAttribArray(a_Position);

    // Set the clear color for the canvas (cornflower blue)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the points (3 points total)
    gl.drawArrays(gl.POINTS, 0, 3);
};