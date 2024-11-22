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

    const ext = gl.getExtension("OES_element_index_uint");
    if (!ext) {
        console.error("OES_element_index_uint is not available.");
        return;
    }

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Set up the projection and view matrices
    const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100.0);
    const viewMatrix = lookAt(vec3(2.0, 2.0, 5.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    const modelMatrix = mat4();

    const u_Projection = gl.getUniformLocation(program, "u_Projection");
    const u_View = gl.getUniformLocation(program, "u_View");
    const u_Model = gl.getUniformLocation(program, "u_Model");

    gl.uniformMatrix4fv(u_Projection, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(u_View, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(u_Model, false, flatten(modelMatrix));

    // Read and parse the OBJ file
    const objFileName = "sample.obj";
    const drawingInfo = await readOBJFile(objFileName, 1.0, true);

    if (!drawingInfo) {
        console.error("Failed to load OBJ file.");
        return;
    }

    // Debug OBJ content
    console.log("Vertices:", drawingInfo.vertices);
    console.log("Normals:", drawingInfo.normals);
    console.log("Colors:", drawingInfo.colors);
    console.log("Indices:", drawingInfo.indices);

    // Set up buffers
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    const nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    // Get attribute locations
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_Normal = gl.getAttribLocation(program, "a_Normal");
    const a_Color = gl.getAttribLocation(program, "a_Color");

    // Debug attribute locations
    console.log("a_Position:", a_Position);
    console.log("a_Color:", a_Color);
    console.log("a_Normal:", a_Normal);

    // Bind vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Bind vertex normals
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Bind vertex colors
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    // Render the model
    function render() {
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
    }

    render();
};