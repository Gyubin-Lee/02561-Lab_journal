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

    // Number of vertices to approximate a circle
    var n = 100;
    var radius = 0.5;
    var centerX = 0;
    var centerY = 0;


    // Define the vertices for three points with colors
    var vertices = [];
    vertices.push(centerX, centerY);
    for (var i = 0; i <= n; i++) {
        var theta = 2 * Math.PI * i / n;

        var x = radius * Math.cos(theta) + centerX;
        var y = radius * Math.sin(theta) + centerY;

        vertices.push(x, y);
    }

    var verticesArray = new Float32Array(vertices);

    // Create a buffer object
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Load the vertex data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);

    // Get the location of the attribute 'a_Position' in the vertex shader
    var a_Position = gl.getAttribLocation(program, "a_Position");

    // Specify the location and format of the vertex attribute
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Set the clear color for the canvas (cornflower blue)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    // Set the translation
    var translation = [0.0, 0.0];
    var speed = 0.01;
    var direction = 1;

    // Get the location
    var u_Translation = gl.getUniformLocation(program, "u_translation");

    // Define render function
    var render = function () {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Update the translation
        translation[1] += speed * direction;
        if (translation[1] > 0.5 || translation[1] < -0.5) {
            direction *= -1;
        }

        // Load the translation into the uniform
        gl.uniform2fv(u_Translation, translation);

        // Draw the points
        gl.drawArrays(gl.TRIANGLE_FAN, 0, n+2);

        // Request the browser to call render
        requestAnimationFrame(render);
    };

    // Call the render function
    render();
};

