window.onload = async function init() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Initialize shaders
    const groundProgram = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");
    const teapotProgram = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");

    const ext = gl.getExtension("OES_element_index_uint");
    if (!ext) {
        console.error("OES_element_index_uint is not available.");
        return;
    }

    gl.clearColor(0.2, 0.4, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Set up projection and view matrices
    const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
    const viewMatrix = lookAt(vec3(0, 0.05, -0.8), vec3(0, 0, -1), vec3(0, 1, 0));

    // Helper function to initialize attribute variables
    function initAttributeVariable(gl, program, buffer, attribute, size, type, stride, offset) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const location = gl.getAttribLocation(program, attribute);
        if (location < 0) {
            console.error(`Failed to get the storage location of ${attribute}`);
            return;
        }
        gl.vertexAttribPointer(location, size, type, false, stride, offset);
        gl.enableVertexAttribArray(location);
    }

    // Ground quad setup
    const groundVertices = new Float32Array([
        -2, -1, -1,   2, -1, -1,   2, -1, -5,  -2, -1, -5,
    ]);
    const groundTexCoords = new Float32Array([
        -1, -1, 1, -1, 1, 1, -1, 1
    ]);
    const groundIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    const groundBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, groundVertices, gl.STATIC_DRAW);

    const groundTexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundTexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, groundTexCoords, gl.STATIC_DRAW);

    const groundIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, groundIndices, gl.STATIC_DRAW);

    const groundTex = gl.createTexture();
    const groundImage = new Image();
    groundImage.src = "../xamp23.png";
    groundImage.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, groundTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, groundImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    // Teapot setup
    const teapot = await readOBJFile("../teapot.obj", 0.25, true);
    if (!teapot) {
        alert("Failed to load teapot OBJ file.");
        return;
    }

    const teapotBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, teapot.vertices, gl.STATIC_DRAW);

    const teapotNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, teapot.normals, gl.STATIC_DRAW);

    const teapotColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, teapot.colors, gl.STATIC_DRAW);

    const teapotIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, teapot.indices, gl.STATIC_DRAW);

    // Animation state
    let motionEnabled = true;
    let teapotY = -1;
    let direction = 0.01;

    // light state
    let lightEnabled = true;

    // Add event listener for motion toggle
    const motionToggle = document.getElementById("motion-toggle");
    motionToggle.addEventListener("click", () => {
        motionEnabled = !motionEnabled;
    });

    // Add event listener for light toggle
    const lightToggle = document.getElementById("light-toggle");
    lightToggle.addEventListener("click", () => {
        lightEnabled = !lightEnabled;
    });

    // Shadow matrix calculation
    function computeShadowMatrix(lightPosition, groundY, modelMatrix) {
        const d = -(lightPosition[1] - groundY);
        const Mp = mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 1 / d, 0, 0
        );
        const T_light = translate(lightPosition[0], lightPosition[1], lightPosition[2]);
        const T_neg_light = translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]);
        return mult(T_light, mult(Mp, mult(T_neg_light, modelMatrix)));
    }

    const lightPosition = vec4(2, 2, -1, 1);
    const groundY = -1;
    const epsilon = -1e-2;
    var offset_plane = groundY + epsilon

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw ground
        gl.useProgram(groundProgram);

        const groundProjectionLoc = gl.getUniformLocation(groundProgram, "u_ProjectionMatrix");
        const groundViewLoc = gl.getUniformLocation(groundProgram, "u_ViewMatrix");
        const groundModelLoc = gl.getUniformLocation(groundProgram, "u_ModelMatrix");
        const groundTexLoc = gl.getUniformLocation(groundProgram, "u_TexMap");

        const groundModelMatrix = mat4();
        gl.uniformMatrix4fv(groundProjectionLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(groundViewLoc, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(groundModelLoc, false, flatten(groundModelMatrix));

        initAttributeVariable(gl, groundProgram, groundBuffer, "a_Position", 3, gl.FLOAT, 0, 0);
        initAttributeVariable(gl, groundProgram, groundTexBuffer, "a_TexCoord", 2, gl.FLOAT, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, groundTex);
        gl.uniform1i(groundTexLoc, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
        gl.drawElements(gl.TRIANGLES, groundIndices.length, gl.UNSIGNED_SHORT, 0);

        // Animate teapot
        if (motionEnabled) {
            teapotY += direction;
            if (teapotY >= 0.5 || teapotY <= -1) direction *= -1;
        }

        // Draw shadows
        gl.useProgram(teapotProgram);
        const teapotModelMatrix = mult(translate(0, teapotY, -3), scalem(0.25, 0.25, 0.25));

        const shadowMatrix = computeShadowMatrix(lightPosition, offset_plane, teapotModelMatrix);
        
        const teaProjectionLoc = gl.getUniformLocation(teapotProgram, "u_Projection");
        const teaViewLoc = gl.getUniformLocation(teapotProgram, "u_View");
        const teaModelLoc = gl.getUniformLocation(teapotProgram, "u_Model");
        const u_Visibility = gl.getUniformLocation(teapotProgram, "visible");
   
        gl.uniformMatrix4fv(teaProjectionLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(teaViewLoc, false, flatten(viewMatrix));

        initAttributeVariable(gl, teapotProgram, teapotBuffer, "a_Position", 4, gl.FLOAT, 0, 0);
        initAttributeVariable(gl, teapotProgram, teapotNormalBuffer, "a_Normal", 3, gl.FLOAT, 0, 0);
        initAttributeVariable(gl, teapotProgram, teapotColorBuffer, "a_Color", 4, gl.FLOAT, 0, 0);
        
        if (lightEnabled) {
            gl.depthFunc(gl.GREATER);
            
            gl.uniformMatrix4fv(teaModelLoc, false, flatten(shadowMatrix));
            gl.uniform1f(u_Visibility, false);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexBuffer);
            gl.drawElements(gl.TRIANGLES, teapot.indices.length, gl.UNSIGNED_INT, 0);
        }

        // Draw teapot
        gl.depthFunc(gl.LESS);
        gl.uniform1f(u_Visibility, true);
        gl.uniformMatrix4fv(teaModelLoc, false, flatten(teapotModelMatrix));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexBuffer);
        gl.drawElements(gl.TRIANGLES, teapot.indices.length, gl.UNSIGNED_INT, 0);

        requestAnimationFrame(render);
    }

    render();
};