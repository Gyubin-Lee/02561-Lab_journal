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

    // Set up the viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.4, 0.8, 1.0);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Vertex data
    const vertices = new Float32Array([
        -4, -1, -1,   // Bottom-left
         4, -1, -1,   // Bottom-right
         4, -1, -21,  // Top-right
        -4, -1, -21   // Top-left
    ]);

    const texCoords = new Float32Array([
        -1.5,  0.0,   // Bottom-left
         2.5,  0.0,   // Bottom-right
         2.5, 10.0,   // Top-right
        -1.5, 10.0    // Top-left
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

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

    // Set up texture
    const texSize = 64;
    const myTexels = new Uint8Array(texSize * texSize * 4);

    for (let i = 0; i < texSize; ++i) {
        for (let j = 0; j < texSize; ++j) {
            const patchX = Math.floor(i / 8);
            const patchY = Math.floor(j / 8);
            const isWhite = (patchX + patchY) % 2 === 0;

            const idx = (i * texSize + j) * 4;
            myTexels[idx] = isWhite ? 255 : 0;     // R
            myTexels[idx + 1] = isWhite ? 255 : 0; // G
            myTexels[idx + 2] = isWhite ? 255 : 0; // B
            myTexels[idx + 3] = 255;               // A
        }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        texSize,
        texSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        myTexels
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // Set up uniform
    const u_TexMap = gl.getUniformLocation(program, "u_TexMap");
    gl.uniform1i(u_TexMap, 0);

    const u_Projection = gl.getUniformLocation(program, "u_Projection");
    const u_View = gl.getUniformLocation(program, "u_View");

    const projectionMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100.0);
    const viewMatrix = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));

    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Render
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    render();
};