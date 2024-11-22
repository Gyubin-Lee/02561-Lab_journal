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

    // Enabling use of 32-bit unsigned integers
    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext) {
        console.log("OES_element_index_uint is unsupported");
    }

    // Define the vertices of the cube
    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
    ];

    // Define the edges and faces of the cube
    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0,  // Bottom face
        4, 5, 5, 6, 6, 7, 7, 4,  // Top face
        0, 4, 1, 5, 2, 6, 3, 7   // Connecting edges
    ]);

    var triangle_indices = new Uint32Array([
        1, 0, 3, 3, 2, 1,  // Bottom face
        2, 3, 7, 7, 6, 2,  // Right face
        3, 0, 4, 4, 7, 3,  // Front face
        6, 5, 1, 1, 2, 6,  // Top face
        4, 5, 6, 6, 7, 4,  // Back face
        5, 4, 0, 0, 1, 5   // Left face
    ]);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Vertex position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Setup attribute for a_Position
    var a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Element buffer for triangles
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangle_indices, gl.STATIC_DRAW);

    // Define orthographic projection matrix
    var orthoMatrix = ortho(-2, 2, -2, 2, -2, 2);

    // Define view matrix
    var viewMatrix = lookAt(vec3(1.0, 1.0, 1.0), vec3(0.5, 0.5, 0.5), vec3(0.0, 1.0, 0.0));

    // Define model matrix (initial rotation)
    var modelMatrix = mult(rotateX(0), rotateY(0));
    const finalMatrix = mult(orthoMatrix, mult(viewMatrix, modelMatrix));

    // Set the MVP matrix
    var u_MVP = gl.getUniformLocation(program, "MVP");
    gl.uniformMatrix4fv(u_MVP, false, flatten(finalMatrix));

    // Set the uniform color for the cube faces
    var u_FragColor = gl.getUniformLocation(program, "u_FragColor");
    gl.uniform4f(u_FragColor, 0.5, 0.5, 1.0, 1.0); // Set to blue (R, G, B, A)

    // Clear the canvas and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw solid cube
    gl.drawElements(gl.TRIANGLES, triangle_indices.length, gl.UNSIGNED_INT, 0);

    // Draw wireframe over the cube
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wire_indices, gl.STATIC_DRAW);
    gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, 1.0); // Set to black for wireframe
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);
};