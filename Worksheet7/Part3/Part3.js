window.onload = function init() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize shaders
    const bgProgram = initShaders(gl, "vertex-shader-bg", "fragment-shader-bg");
    const reflectionProgram = initShaders(gl, "vertex-shader-reflection", "fragment-shader-reflection");

    gl.enable(gl.DEPTH_TEST);

    // Cube map texture setup
    const cubeMap = [
        '../textures/cm_left.png',
        '../textures/cm_right.png',
        '../textures/cm_top.png',
        '../textures/cm_bottom.png',
        '../textures/cm_back.png',
        '../textures/cm_front.png'
    ];

    let g_tex_ready = 0;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    for (let i = 0; i < 6; i++) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            g_tex_ready++;
        };
        image.src = cubeMap[i];
    }

    // Background setup
    const bgVertices = new Float32Array([
        -1, -1, 0.999, 1,
         1, -1, 0.999, 1,
         1,  1, 0.999, 1,
        -1,  1, 0.999, 1
    ]);
    const bgIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    const bgBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bgVertices, gl.STATIC_DRAW);

    const bgIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bgIndices, gl.STATIC_DRAW);

    // Sphere setup
    const vertices = [];
    const normals = [];
    const indices = [];
    let subdivisionLevel = 6;

    function generateSphere() {
        vertices.length = 0;
        normals.length = 0;
        indices.length = 0;

        const initialTetrahedron = [
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.942809, -0.333333),
            vec3(-0.816497, -0.471405, -0.333333),
            vec3(0.816497, -0.471405, -0.333333)
        ];

        function subdivideTriangle(a, b, c, depth) {
            if (depth === 0) {
                const na = normalize([...a]);
                const nb = normalize([...b]);
                const nc = normalize([...c]);

                vertices.push(na, nb, nc);
                normals.push(na, nb, nc);

                const idx = vertices.length - 3;
                indices.push(idx, idx + 1, idx + 2);
            } else {
                const ab = normalize(mix(a, b, 0.5));
                const bc = normalize(mix(b, c, 0.5));
                const ca = normalize(mix(c, a, 0.5));

                subdivideTriangle(a, ab, ca, depth - 1);
                subdivideTriangle(ab, b, bc, depth - 1);
                subdivideTriangle(bc, c, ca, depth - 1);
                subdivideTriangle(ab, bc, ca, depth - 1);
            }
        }

        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[1], initialTetrahedron[2], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[3], initialTetrahedron[2], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[3], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[2], initialTetrahedron[3], subdivisionLevel);
    }

    generateSphere();

    const sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    function render() {
        if (g_tex_ready < 6) {
            requestAnimationFrame(render);
            return;
        }
        // Extract rotational part of the view matrix
        function extractRotationMatrix(viewMatrix) {
            const rotationMatrix = mat4(); // Initialize identity matrix
            for (let i = 0; i < 3; i++) { // Copy the upper-left 3x3 part
                for (let j = 0; j < 3; j++) {
                    rotationMatrix[i][j] = viewMatrix[i][j];
                }
            }
            return rotationMatrix;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw Background
        gl.useProgram(bgProgram);

        const u_Mtex = gl.getUniformLocation(bgProgram, "u_Mtex");
        const a_Position_bg = gl.getAttribLocation(bgProgram, "a_Position");

        const projectionMatrix = perspective(90, canvas.width / canvas.height, 0.1, 10.0);
        const projectionInverse = inverse(projectionMatrix);

        const viewMatrix = lookAt(vec3(0.0, 0.0, 4.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        const rotationalPart = extractRotationMatrix(viewMatrix);
        const rotationalInverse = inverse(rotationalPart);        

        const mTex = mult(rotationalInverse, projectionInverse);
        gl.uniformMatrix4fv(u_Mtex, false, flatten(mTex));

        gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
        gl.vertexAttribPointer(a_Position_bg, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position_bg);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndexBuffer);
        gl.drawElements(gl.TRIANGLES, bgIndices.length, gl.UNSIGNED_SHORT, 0);

        // Draw Sphere with Reflection
        gl.useProgram(reflectionProgram);
        const a_Position = gl.getAttribLocation(reflectionProgram, "a_Position");
        const a_Normal = gl.getAttribLocation(reflectionProgram, "a_Normal");
        const u_Projection = gl.getUniformLocation(reflectionProgram, "u_Projection");
        const u_View = gl.getUniformLocation(reflectionProgram, "u_View");
        const u_Model = gl.getUniformLocation(reflectionProgram, "u_Model");
        const u_EyePosition = gl.getUniformLocation(reflectionProgram, "u_EyePosition");
        const u_Reflective = gl.getUniformLocation(reflectionProgram, "u_Reflective");

        gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(u_Model, false, flatten(mat4()));
        gl.uniform3fv(u_EyePosition, flatten(vec3(0.0, 0.0, 4.0)));
        gl.uniform1i(u_Reflective, true);

        gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }

    render();
};