// Wait until the window is loaded
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

    // Enable depth testing and back-face culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Define initial variables
    var vertices = [];
    var normals = [];
    var indices = [];
    var subdivisionLevel = 6;
    const maxLevel = 6, minLevel = 0;

    // Create buffers
    var vBuffer = gl.createBuffer();
    var nBuffer = gl.createBuffer();
    var iBuffer = gl.createBuffer();

    // Get uniform and attribute locations
    var a_Position = gl.getAttribLocation(program, "a_Position");
    var a_Normal = gl.getAttribLocation(program, "a_Normal");
    var u_Projection = gl.getUniformLocation(program, "u_Projection");
    var u_View = gl.getUniformLocation(program, "u_View");
    var u_Model = gl.getUniformLocation(program, "u_Model");
    var u_LightDirection = gl.getUniformLocation(program, "u_LightDirection");
    var u_DiffuseColor = gl.getUniformLocation(program, "u_DiffuseColor");

    // Define view and projection matrices
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 10.0); // Ensure near and far planes are appropriate
    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));

    // Set light properties
    var lightDirection = vec3(0.0, 0.0, -1.0);
    gl.uniform3fv(u_LightDirection, flatten(lightDirection));
    gl.uniform4fv(u_DiffuseColor, [0.0, 0.5, 0.8, 1.0]); // Light blue diffuse color

    // Subdivision logic
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
                // Normalize vertices for sphere projection
                var na = normalize([...a]);
                var nb = normalize([...b]);
                var nc = normalize([...c]);

                vertices.push(na, nb, nc);

                // Normals are the same as positions for a unit sphere
                normals.push(na, nb, nc);

                var idx = vertices.length - 3;
                indices.push(idx, idx + 1, idx + 2);
            } else {
                // Compute midpoints
                var ab = normalize(mix(a, b, 0.5));
                var bc = normalize(mix(b, c, 0.5));
                var ca = normalize(mix(c, a, 0.5));

                // Recursively subdivide
                subdivideTriangle(a, ab, ca, depth - 1);
                subdivideTriangle(ab, b, bc, depth - 1);
                subdivideTriangle(bc, c, ca, depth - 1);
                subdivideTriangle(ab, bc, ca, depth - 1);
            }
        }

        // Start subdivision
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[1], initialTetrahedron[2], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[3], initialTetrahedron[2], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[3], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[2], initialTetrahedron[3], subdivisionLevel);

        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render sphere with Gouraud shading
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Update model matrix for camera rotation
        var time = Date.now() / 1000;
        var radius = 4.0;
        var eye = vec3(radius * Math.sin(time), 1.0, radius * Math.cos(time));
        var viewMatrix = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

        gl.uniformMatrix4fv(u_Model, false, flatten(mat4()));

        // Bind buffers and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        // Request next frame
        requestAnimationFrame(render);
    }

    // Button listeners
    document.getElementById("increase").onclick = function () {
        if (subdivisionLevel < maxLevel) {
            subdivisionLevel++;
            generateSphere();
            render();
        }
    };

    document.getElementById("decrease").onclick = function () {
        if (subdivisionLevel > minLevel) {
            subdivisionLevel--;
            generateSphere();
            render();
        }
    };

    // Initial setup and render
    generateSphere();
    render();
};