window.onload = function init() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize shaders
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Set up viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Vertex data for quads
    const vertices = new Float32Array([
        // Ground quad
        -2, -1, -1,   2, -1, -1,   2, -1, -5,  -2, -1, -5,
        // Parallel red quad
        0.25, -0.5, -1.25,   0.75, -0.5, -1.25,   0.75, -0.5, -1.75,  0.25, -0.5, -1.75,
        // Perpendicular red quad
        -1, -1, -2.5,  -1, 0, -2.5,  -1, 0, -3,  -1, -1, -3,
    ]);

    const texCoords = new Float32Array([
        // Ground quad
        0, 0, 1, 0, 1, 1, 0, 1,
        // Parallel red quad
        0, 0, 1, 0, 1, 1, 0, 1,
        // Perpendicular red quad
        0, 0, 0, 1, 1, 1, 1, 0,
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,  // Ground quad
        4, 5, 6, 4, 6, 7,  // Parallel red quad
        8, 9, 10, 8, 10, 11, // Perpendicular red quad
    ]);

    // Set up buffers
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);

    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Load ground texture
    const texture0 = gl.createTexture();
    const image = new Image();
    image.src = "../xamp23.png";
    image.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        render();
    };

    // Create red texture
    const texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Set up uniforms
    const u_Projection = gl.getUniformLocation(program, "u_Projection");
    const u_View = gl.getUniformLocation(program, "u_View");
    const u_TexMap = gl.getUniformLocation(program, "u_TexMap");

    const projectionMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100.0);
    const viewMatrix = lookAt(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0));

    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw ground quad
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(u_TexMap, 0);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        // Draw parallel red quad
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(u_TexMap, 1);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6 * 2);

        // Draw perpendicular red quad
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12 * 2);
    }
};