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
    var u_LightIntensity = gl.getUniformLocation(program, "u_LightIntensity");
    var u_kd = gl.getUniformLocation(program, "u_kd");
    var u_ks = gl.getUniformLocation(program, "u_ks");
    var u_Shininess = gl.getUniformLocation(program, "u_Shininess");

    // Define projection and fixed view matrices
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100.0);
    var viewMatrix = lookAt(vec3(2.0, 2.0, 2.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    var modelMatrix = mat4();

    // Set uniform matrices
    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));

    // Initialize light properties
    var lightDirection = vec3(0.0, 0.0, -1.0);
    var lightIntensity = 1.0; // Default light intensity
    var kd = 0.5; // Diffuse coefficient
    var ks = 0.5; // Specular coefficient
    var shininess = 32; // Shininess factor

    // Send initial light properties to the shader
    gl.uniform3fv(u_LightDirection, flatten(lightDirection));
    gl.uniform1f(u_LightIntensity, lightIntensity);
    gl.uniform1f(u_kd, kd);
    gl.uniform1f(u_ks, ks);
    gl.uniform1f(u_Shininess, shininess);

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
                // Normalize each vertex to project it onto the sphere
                var normalizedA = normalize([...a]);
                var normalizedB = normalize([...b]);
                var normalizedC = normalize([...c]);

                vertices.push(normalizedA, normalizedB, normalizedC);
                normals.push(normalizedA, normalizedB, normalizedC);

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

        // Update GPU buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Render the sphere
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Send model matrix to the shader
        gl.uniformMatrix4fv(u_Model, false, flatten(modelMatrix));

        // Bind buffers and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Slider listeners
    document.getElementById("kd-slider").addEventListener("input", function () {
        kd = parseFloat(this.value);
        gl.uniform1f(u_kd, kd);
        document.getElementById("kd-value").textContent = kd;
        render();
    });

    document.getElementById("ks-slider").addEventListener("input", function () {
        ks = parseFloat(this.value);
        gl.uniform1f(u_ks, ks);
        document.getElementById("ks-value").textContent = ks;
        render();
    });

    document.getElementById("shininess-slider").addEventListener("input", function () {
        shininess = parseInt(this.value);
        gl.uniform1f(u_Shininess, shininess);
        document.getElementById("shininess-value").textContent = shininess;
        render();
    });

    document.getElementById("light-slider").addEventListener("input", function () {
        lightIntensity = parseFloat(this.value);
        gl.uniform1f(u_LightIntensity, lightIntensity);
        document.getElementById("light-value").textContent = lightIntensity;
        render();
    });

    // Subdivision buttons
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