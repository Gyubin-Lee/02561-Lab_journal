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

    // Define vertices and texture coordinates
    const vertices = [
        vec3(-4, -1, -1),
        vec3(4, -1, -1),
        vec3(4, -1, -21),
        vec3(-4, -1, -21),
    ];

    const texCoords = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0),
    ];

    const indices = [0, 1, 2, 0, 2, 3];

    // Load data into buffers
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    const tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Get attribute locations
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");

    // Bind vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Bind texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);

    // Set up the projection and view matrices
    const u_Projection = gl.getUniformLocation(program, "u_Projection");
    const u_View = gl.getUniformLocation(program, "u_View");

    const projectionMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100);
    const viewMatrix = mat4();

    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Create a checkerboard texture
    const texSize = 64;
    const image = new Uint8Array(texSize * texSize * 4);
    for (let i = 0; i < texSize; ++i) {
        for (let j = 0; j < texSize; ++j) {
            const patch = Math.floor(i / 8) % 2 === Math.floor(j / 8) % 2 ? 255 : 0;
            const idx = 4 * (i * texSize + j);
            image[idx] = patch; // Red
            image[idx + 1] = patch; // Green
            image[idx + 2] = patch; // Blue
            image[idx + 3] = 255; // Alpha
        }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Initial texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    const u_Texture = gl.getUniformLocation(program, "u_Texture");
    gl.uniform1i(u_Texture, 0);

    // Event listeners for wrapping and filtering modes
    document.getElementById("wrapMode").addEventListener("change", (e) => {
        const mode = e.target.value === "REPEAT" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode);
        render();
    });

    document.getElementById("filterMode").addEventListener("change", (e) => {
        const filter = {
            NEAREST: gl.NEAREST,
            LINEAR: gl.LINEAR,
            NEAREST_MIPMAP_NEAREST: gl.NEAREST_MIPMAP_NEAREST,
            LINEAR_MIPMAP_NEAREST: gl.LINEAR_MIPMAP_NEAREST,
            NEAREST_MIPMAP_LINEAR: gl.NEAREST_MIPMAP_LINEAR,
            LINEAR_MIPMAP_LINEAR: gl.LINEAR_MIPMAP_LINEAR,
        }[e.target.value];

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        render();
    });

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    render();
};