window.onload = async function init() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize shaders
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Enable depth testing and back-face culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Cube map texture setup
    const cubeMap = [
        '../textures/cm_left.png',    // POSITIVE_X
        '../textures/cm_right.png',   // NEGATIVE_X
        '../textures/cm_top.png',     // POSITIVE_Y
        '../textures/cm_bottom.png',  // NEGATIVE_Y
        '../textures/cm_back.png',    // POSITIVE_Z
        '../textures/cm_front.png'    // NEGATIVE_Z
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

    // Sphere setup (same as the textured sphere)
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

    // Create buffers
    const vBuffer = gl.createBuffer();
    const nBuffer = gl.createBuffer();
    const iBuffer = gl.createBuffer();

    function initBuffers() {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render the sphere
    function render() {
        if (g_tex_ready < 6) {
            requestAnimationFrame(render);
            return;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const a_Position = gl.getAttribLocation(program, "a_Position");
        const a_Normal = gl.getAttribLocation(program, "a_Normal");
        const u_Projection = gl.getUniformLocation(program, "u_Projection");
        const u_View = gl.getUniformLocation(program, "u_View");
        const u_Model = gl.getUniformLocation(program, "u_Model");
        const u_CubeMap = gl.getUniformLocation(program, "u_CubeMap");

        const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 10.0);
        const viewMatrix = lookAt(vec3(0.0, 0.0, 4.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        const modelMatrix = mat4();

        gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(u_Model, false, flatten(modelMatrix));
        gl.uniform1i(u_CubeMap, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }

    generateSphere();
    initBuffers();
    render();
};