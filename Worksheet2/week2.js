// Wait until the window is loaded
window.onload = function init() {
    const canvas = document.getElementById("webgl-canvas");
    const colorMenu = document.getElementById("colorMenu");
    const clearMenu = document.getElementById("clearMenu");
    const clearButton = document.getElementById("clearButton");
    const pointModeButton = document.getElementById("pointModeButton");
    const triangleModeButton = document.getElementById("triangleModeButton");
    const circleModeButton = document.getElementById("circleModeButton"); // New button for circle mode
    const gl = canvas.getContext("webgl");

    const colors = [
        [0.0, 0.0, 0.0, 1.0],      // Black
        [1.0, 0.0, 0.0, 1.0],      // Red
        [1.0, 1.0, 0.0, 1.0],      // Yellow
        [0.0, 1.0, 0.0, 1.0],      // Green
        [0.0, 0.0, 1.0, 1.0],      // Blue
        [1.0, 0.0, 1.0, 1.0],      // Magenta
        [0.0, 1.0, 1.0, 1.0],      // Cyan
        [0.3921, 0.5843, 0.9294, 1.0] // Cornflower
    ];

    if (!gl) {
        alert("Your browser does not support WebGL");
        return;
    }

    // Initialize the shaders using initShaders.js
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Vertex buffer pre-allocation
    var maxVertices = 10000;
    var index = 0, numPoints = 0;

    // Create buffers
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVertices * 2 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVertices * 4 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

    // Get attribute locations
    var a_Position = gl.getAttribLocation(program, "a_Position");
    var a_Color = gl.getAttribLocation(program, "a_Color");

    // Set default mode and temporary arrays
    let drawingMode = "point"; // "point", "triangle", or "circle"
    let tempPoints = [];
    let tempColors = [];
    let circleCenter = null;

    // Button event listeners to switch modes
    pointModeButton.addEventListener("click", function() {
        drawingMode = "point";
        tempPoints = [];
        tempColors = [];
        circleCenter = null;
    });

    triangleModeButton.addEventListener("click", function() {
        drawingMode = "triangle";
        tempPoints = [];
        tempColors = [];
        circleCenter = null;
    });

    circleModeButton.addEventListener("click", function() {
        drawingMode = "circle";
        tempPoints = [];
        tempColors = [];
        circleCenter = null;
    });

    // Clear button event listener
    clearButton.addEventListener("click", function(ev) {
        const clearColorIndex = clearMenu.selectedIndex;
        const bgcolor = colors[clearColorIndex];
        
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Clear the buffers and reset counters
        numPoints = 0;
        index = 0;
        tempPoints = [];
        tempColors = [];
        circleCenter = null;
        centerColor = null;
    });

    // Canvas click event listener
    canvas.addEventListener("click", function(ev) {
        var bbox = ev.target.getBoundingClientRect();
        var x = 2 * (ev.clientX - bbox.left) / canvas.width - 1;
        var y = 2 * (canvas.height - (ev.clientY - bbox.top) - 1) / canvas.height - 1;
        var colorSelected = colors[colorMenu.selectedIndex];

        if (drawingMode === "point") {
            addPointAsSquare(x, y, colorSelected);
        } else if (drawingMode === "triangle") {
            // Collect points for triangle
            tempPoints.push([x, y]);
            tempColors.push(colorSelected);

            if (tempPoints.length === 3) {
                addTriangle(tempPoints, tempColors);
                tempPoints = [];
                tempColors = [];
            } else {
                addPointAsSquare(x, y, colorSelected, offset=0.002);
            }
        } else if (drawingMode === "circle") {
            if (!circleCenter) {
                // First click: Set the center of the circle
                circleCenter = [x, y];
                centerColor = colorSelected;
                addPointAsSquare(x, y, colorSelected);
            } else {
                // Second click: Calculate radius and draw circle
                const radius = Math.sqrt(Math.pow(x - circleCenter[0], 2) + Math.pow(y - circleCenter[1], 2));
                drawCircle(circleCenter, radius, colorSelected, centerColor);
                circleCenter = null; // Reset for the next circle
            }
        }
    });

    // Set the clear color for the canvas
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Helper function to add a point as a square (for visibility)
    function addPointAsSquare(x, y, color, offset=0.03) {
        const topLeft = [x - offset, y + offset];
        const topRight = [x + offset, y + offset];
        const bottomRight = [x + offset, y - offset];
        const bottomLeft = [x - offset, y - offset];

        addVertex(topLeft[0], topLeft[1], color);
        addVertex(topRight[0], topRight[1], color);
        addVertex(bottomRight[0], bottomRight[1], color);

        addVertex(topLeft[0], topLeft[1], color);
        addVertex(bottomRight[0], bottomRight[1], color);
        addVertex(bottomLeft[0], bottomLeft[1], color);
    }

    // Helper function to add a triangle
    function addTriangle(points, colors) {
        points.forEach((point, i) => {
            addVertex(point[0], point[1], colors[i]);
        });
    }

    // Function to draw a circle using individual triangles
    function drawCircle(center, radius, color, centerColor) {
        const numSegments = 100; // More segments = smoother circle
        const angleIncrement = (2 * Math.PI) / numSegments;

        for (let i = 0; i < numSegments; i++) {
            const angle1 = i * angleIncrement;
            const angle2 = (i + 1) * angleIncrement;

            // Calculate points on the circumference
            const x1 = center[0] + radius * Math.cos(angle1);
            const y1 = center[1] + radius * Math.sin(angle1);
            const x2 = center[0] + radius * Math.cos(angle2);
            const y2 = center[1] + radius * Math.sin(angle2);

            // Create a triangle for this segment
            addVertex(center[0], center[1], centerColor); // Center of circle
            addVertex(x1, y1, color); // First point on circumference
            addVertex(x2, y2, color); // Second point on circumference
        }
    }

    // Helper function to add a vertex to buffers
    function addVertex(x, y, color) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * 2 * Float32Array.BYTES_PER_ELEMENT, new Float32Array([x, y]));
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * 4 * Float32Array.BYTES_PER_ELEMENT, new Float32Array(color));
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        numPoints = Math.max(numPoints, ++index);
        index %= maxVertices;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    }
};