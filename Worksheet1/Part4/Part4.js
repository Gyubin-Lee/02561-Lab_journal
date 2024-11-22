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

    // Define the vertices for three points with colors
    var verticesColors = new Float32Array([
        -0.5, 0.5,  1.0, 0.0, 0.0, 1.0,
        0.5, 0.5,   0.0, 1.0, 0.0, 1.0,
        0.5, -0.5,  0.0, 0.0, 1.0, 1.0, //triangle 1
        -0.5, 0.5,  1.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.0, 1.0, 0.0, 1.0,
        0.5, -0.5,  0.0, 0.0, 1.0, 1.0  //triangle 2
    ]);

    // Create a buffer object
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Load the vertex data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    // Get the location of the attribute 'a_Position' in the vertex shader
    var a_Position = gl.getAttribLocation(program, "a_Position");
    var a_Color = gl.getAttribLocation(program, "a_Color");

    // Specify the location and format of the vertex attribute
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(a_Color);

    // Set the clear color for the canvas (cornflower blue)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    // Set the angle
    var angle = 0;

    // Define render function
    var render = function () {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set the rotation matrix
        var rotationMatrix = new Float32Array([
            Math.cos(angle), -Math.sin(angle), 0.0, 0.0,
            Math.sin(angle), Math.cos(angle), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]);

        // Get the location of the uniform 'u_RotationMatrix' in the vertex shader
        var u_RotationMatrix = gl.getUniformLocation(program, "u_RotationMatrix");

        // Load the rotation matrix into the uniform
        gl.uniformMatrix4fv(u_RotationMatrix, false, rotationMatrix);

        // Draw the points (6 points total)
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Increase the angle
        angle += 0.01;

        // Request the browser to call render
        requestAnimationFrame(render);
    };

    // Call the render function
    render();
};

