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

    // Set up cube data
    const vertices = new Float32Array([
        // Front face
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        // Back face
        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5, -0.5, -0.5,
    ]);

    const colors = new Float32Array([
        // Front face
        1, 0, 0, 1, 0, 0, 1, 1, // Red
        1, 0, 0, 1, 0, 0, 1, 1,
        // Back face
        0, 1, 0, 0, 1, 0, 0, 1, // Green
        0, 1, 0, 0, 1, 0, 0, 1,
        // Top face
        0, 0, 1, 0, 0, 1, 0, 1, // Blue
        0, 0, 1, 0, 0, 1, 0, 1,
        // Bottom face
        1, 1, 0, 1, 1, 0, 1, 1, // Yellow
        1, 1, 0, 1, 1, 0, 1, 1,
        // Left face
        1, 0, 1, 1, 0, 1, 1, 1, // Magenta
        1, 0, 1, 1, 0, 1, 1, 1,
        // Right face
        0, 1, 1, 0, 1, 1, 0, 1, // Cyan
        0, 1, 1, 0, 1, 1, 0, 1,
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // Front face
        4, 5, 6, 4, 6, 7, // Back face
        0, 3, 5, 0, 5, 4, // Left face
        1, 7, 6, 1, 6, 2, // Right face
        3, 2, 6, 3, 6, 5, // Top face
        0, 4, 7, 0, 7, 1  // Bottom face
    ]);

    // Create buffers
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    const a_Color = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Set up projection and view matrices
    const u_ProjectionMatrix = gl.getUniformLocation(program, "u_ProjectionMatrix");
    const u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
    const u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");

    const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, flatten(projectionMatrix));
    var modelMatrix = mat4();

    // Register event handlers
    var currentAngle = [0.0, 0.0];
    initEventHandlers(canvas, currentAngle);

    function initEventHandlers(canvas, currentAngle) {
        var dragging = false;
        var lastX = -1;
        var lastY = -1;

        canvas.onmousedown = function (ev) { // Mouse is pressed
            var x = ev.clientX, y= ev.clientY;
            // Start dragging if a mouse is in <canvas>
            var rect = ev.target.getBoundingClientRect();
            if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
                lastX = x, lastY = y;
                dragging = true;
            }
        };

        // Mouse is released
        canvas.onmouseup = function (ev) {
            dragging = false;
        };

        canvas.onmousemove = function (ev) { // Mouse is moved
            var x = ev.clientX, y = ev.clientY;
            if (dragging) {
                var factor = 10 / canvas.height;
                var dx = factor * (x - lastX);
                var dy = factor * (y - lastY);

                currentAngle[0] = currentAngle[0] + dy;
                currentAngle[1] = currentAngle[1] + dx;

                modelMatrix = mult(modelMatrix, rotate(currentAngle[0], vec3(1, 0, 0)));
                modelMatrix = mult(modelMatrix, rotate(currentAngle[1], vec3(0, 1, 0)));
            }
            lastX = x, lastY = y;    
        };
    }

    const viewMatrix = lookAt(vec3(0, 0, 3), vec3(0, 0, -1), vec3(0, 1, 0));

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.uniformMatrix4fv(u_ViewMatrix, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(modelMatrix));

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }

    gl.enable(gl.DEPTH_TEST);

    render();
};