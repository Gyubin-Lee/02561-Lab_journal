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

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

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

    // Indices for triangle faces
    var triangle_indices = new Uint8Array([
        1, 0, 3, 3, 2, 1,  // Bottom face
        2, 3, 7, 7, 6, 2,  // Right face
        3, 0, 4, 4, 7, 3,  // Front face
        6, 5, 1, 1, 2, 6,  // Top face
        4, 5, 6, 6, 7, 4,  // Back face
        5, 4, 0, 0, 1, 5   // Left face
    ]);

    // Indices for wireframe edges
    var wire_indices = new Uint8Array([
        0, 1, 1, 2, 2, 3, 3, 0,  // Bottom face edges
        4, 5, 5, 6, 6, 7, 7, 4,  // Top face edges
        0, 4, 1, 5, 2, 6, 3, 7   // Connecting edges
    ]);

    // Setting projection matrix
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 100.0;
    var perspectiveMatrix = perspective(fov, aspect, near, far);
    var u_Projection = gl.getUniformLocation(program, "u_Projection");
    gl.uniformMatrix4fv(u_Projection, false, flatten(perspectiveMatrix));

    // Setting up vertex position buffer and index buffer
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangle_indices, gl.STATIC_DRAW);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Define view matrices
    var at = vec3(0.5, 0.5, 0.5);
    var up = vec3(0.0, 1.0, 0.0);

    var viewMatrix1 = lookAt(vec3(0.0, 0.0, 3.0), at, up);  // One-point perspective
    var viewMatrix2 = lookAt(vec3(3.0, 1.0, 3.0), at, up);  // Two-point perspective
    var viewMatrix3 = lookAt(vec3(3.0, 3.0, 3.0), at, up);  // Three-point perspective

    // Define model matrix (optional: rotate or translate if needed)
    var modelMatrix = mult(rotateX(0), rotateY(0));

    // Uniform locations for view and model matrices
    var u_View = gl.getUniformLocation(program, "u_View");
    var u_Model = gl.getUniformLocation(program, "u_Model");

    // Set color uniform location
    var u_FragColor = gl.getUniformLocation(program, "u_FragColor");

    // Function to render each perspective with a different color
    function renderPerspective(viewMatrix, color, wireframeColor) {
        // Draw solid faces
        gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(u_Model, false, flatten(modelMatrix));
        gl.uniform4fv(u_FragColor, color);
        gl.drawElements(gl.TRIANGLES, triangle_indices.length, gl.UNSIGNED_BYTE, 0);

        // Draw wireframe
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wire_indices, gl.STATIC_DRAW);
        gl.uniform4fv(u_FragColor, wireframeColor);
        gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_BYTE, 0);
    }

    // Clear color and depth buffer before drawing
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Render each perspective with wireframe
    //renderPerspective(viewMatrix1, [1.0, 0.0, 0.0, 1.0], [0.0, 0.0, 0.0, 1.0]); // Red with black wireframe
    //renderPerspective(viewMatrix2, [0.0, 1.0, 0.0, 1.0], [0.0, 0.0, 0.0, 1.0]); // Green with black wireframe
    renderPerspective(viewMatrix3, [0.0, 0.0, 1.0, 1.0], [0.0, 0.0, 0.0, 1.0]); // Blue with black wireframe
};