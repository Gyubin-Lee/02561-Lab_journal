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
    gl.cullFace(gl.BACK); // Cull back-facing triangles
    gl.frontFace(gl.CCW); // Define counter-clockwise as the front face

    // Define initial variables
    var vertices = [];
    var colors = [];
    var indices = [];
    var subdivisionLevel = 6;
    const maxLevel = 6, minLevel = 0;

    // Create buffers
    var vBuffer = gl.createBuffer();
    var cBuffer = gl.createBuffer();
    var iBuffer = gl.createBuffer();

    // Get uniform and attribute locations
    var a_Position = gl.getAttribLocation(program, "a_Position");
    var a_Color = gl.getAttribLocation(program, "a_Color");
    var u_Projection = gl.getUniformLocation(program, "u_Projection");
    var u_View = gl.getUniformLocation(program, "u_View");
    var u_Model = gl.getUniformLocation(program, "u_Model");

    // Define view and projection matrices
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100.0);
    var viewMatrix = lookAt(vec3(2.0, 2.0, 2.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    var modelMatrix = mat4();

    // Send uniform matrices
    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Subdivision logic
    function generateSphere() {
        vertices = [];
        colors = [];
        indices = [];
        var initialTetrahedron = [
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.942809, -0.333333),
            vec3(-0.816497, -0.471405, -0.333333),
            vec3(0.816497, -0.471405, -0.333333)
        ];

        function subdivideTriangle(a, b, c, depth) {
            if (depth === 0) {
                // Normalize vertices and calculate colors
                var na = normalize([...a]);
                var nb = normalize([...b]);
                var nc = normalize([...c]);

                // Push vertices
                vertices.push(na, nb, nc);

                // Calculate colors based on positions
                colors.push(
                    vec4(0.5 * na[0] + 0.5, 0.5 * na[1] + 0.5, 0.5 * na[2] + 0.5, 1.0),
                    vec4(0.5 * nb[0] + 0.5, 0.5 * nb[1] + 0.5, 0.5 * nb[2] + 0.5, 1.0),
                    vec4(0.5 * nc[0] + 0.5, 0.5 * nc[1] + 0.5, 0.5 * nc[2] + 0.5, 1.0)
                );

                // Push indices
                var idx = vertices.length - 3;
                indices.push(idx, idx + 1, idx + 2);
            } else {
                // Compute midpoints and normalize them
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

        // Start subdivision from initial tetrahedron
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[1], initialTetrahedron[2], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[3], initialTetrahedron[2], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[3], initialTetrahedron[1], subdivisionLevel);
        subdivideTriangle(initialTetrahedron[0], initialTetrahedron[2], initialTetrahedron[3], subdivisionLevel);

        // Update GPU buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render sphere
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set model matrix
        gl.uniformMatrix4fv(u_Model, false, flatten(modelMatrix));

        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        // Bind index buffer and draw triangles
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Button event listeners
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