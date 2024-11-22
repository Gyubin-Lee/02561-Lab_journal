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

    // Set up the viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.4, 0.8, 1.0);

    // Enable depth testing and back-face culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Define initial variables
    let vertices = [];
    let normals = [];
    let indices = [];
    const subdivisionLevel = 6;

    // Get uniform and attribute locations
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_Normal = gl.getAttribLocation(program, "a_Normal");
    const u_Projection = gl.getUniformLocation(program, "u_Projection");
    const u_View = gl.getUniformLocation(program, "u_View");
    const u_Model = gl.getUniformLocation(program, "u_Model");
    const u_Texture = gl.getUniformLocation(program, "u_Texture");
    const u_LightDirection = gl.getUniformLocation(program, "u_LightDirection");

    // Set view and projection matrices
    const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 10.0);
    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));

    // Set light direction
    const lightDirection = vec3(0.0, 0.0, -1.0);
    gl.uniform3fv(u_LightDirection, flatten(lightDirection));

    // Load and bind the Earth texture
    const texture = gl.createTexture();
    const image = new Image();
    image.src = "earth.jpg"; // Ensure "earth.jpg" is in the same directory

    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        render();
    };

    // Subdivision logic to generate sphere vertices
    function generateSphere() {
        vertices = [];
        normals = [];
        indices = [];

        const initialTetrahedron = [
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.942809, -0.333333),
            vec3(-0.816497, -0.471405, -0.333333),
            vec3(0.816497, -0.471405, -0.333333),
        ];

        function subdivideTriangle(a, b, c, depth) {
            if (depth === 0) {
                vertices.push(a, b, c);
                normals.push(a, b, c);
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

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const time = Date.now() / 1000;
        const radius = 6.0;
        const eye = vec3(radius * Math.sin(time), 0.0, radius * Math.cos(time)); // Rotate around the y-axis
        const viewMatrix = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    
        gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));
    
        gl.uniformMatrix4fv(u_Model, false, flatten(mat4()));
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
        requestAnimationFrame(render);
    }

    generateSphere();
};