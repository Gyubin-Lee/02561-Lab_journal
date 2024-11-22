window.onload = function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Enable depth testing and backface culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Define initial variables
    var vertices = [];
    var normals = [];
    var indices = [];
    const subdivisionLevel = 6;

    // Create buffers
    var vBuffer = gl.createBuffer();
    var nBuffer = gl.createBuffer();
    var iBuffer = gl.createBuffer();

    // Get uniform and attribute locations
    var a_Position = gl.getAttribLocation(program, "a_Position");
    var a_Normal = gl.getAttribLocation(program, "a_Normal");
    var u_Model = gl.getUniformLocation(program, "u_Model");
    var u_View = gl.getUniformLocation(program, "u_View");
    var u_Projection = gl.getUniformLocation(program, "u_Projection");
    var u_LightDirection = gl.getUniformLocation(program, "u_LightDirection");
    var u_LightIntensity = gl.getUniformLocation(program, "u_LightIntensity");
    var u_kd = gl.getUniformLocation(program, "u_kd");
    var u_ks = gl.getUniformLocation(program, "u_ks");
    var u_ka = gl.getUniformLocation(program, "u_ka");
    var u_Shininess = gl.getUniformLocation(program, "u_Shininess");

    // Set view and projection matrices
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100.0);
    var viewMatrix = lookAt(vec3(2.0, 2.0, 2.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Set light and material properties
    gl.uniform3fv(u_LightDirection, flatten(vec3(0.0, 0.0, -1.0))); // Light direction
    gl.uniform3fv(u_LightIntensity, flatten(vec3(1.0, 1.0, 1.0))); // White light
    gl.uniform3fv(u_kd, flatten(vec3(0.0, 0.5, 0.8))); // Diffuse color
    gl.uniform3fv(u_ks, flatten(vec3(1.0, 1.0, 1.0))); // Specular color
    gl.uniform3fv(u_ka, flatten(vec3(0.2, 0.2, 0.2))); // Ambient color
    gl.uniform1f(u_Shininess, 50.0); // Shininess factor

    // Generate sphere geometry
    function generateSphere() {
        vertices = [];
        normals = [];
        indices = [];

        var initialTetrahedron = [
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.942809, -0.333333),
            vec3(-0.816497, -0.471405, -0.333333),
            vec3(0.816497, -0.471405, -0.333333)
        ];

        function subdivideTriangle(a, b, c, depth) {
            if (depth === 0) {
                vertices.push(normalize(a), normalize(b), normalize(c));
                normals.push(normalize(a), normalize(b), normalize(c));
                let idx = vertices.length - 3;
                indices.push(idx, idx + 1, idx + 2);
            } else {
                let ab = normalize(mix(a, b, 0.5));
                let bc = normalize(mix(b, c, 0.5));
                let ca = normalize(mix(c, a, 0.5));

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

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(u_Model, false, flatten(mat4()));

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    generateSphere();
    render();
};