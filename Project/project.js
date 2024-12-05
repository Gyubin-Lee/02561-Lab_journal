window.onload = function init() {
    const canvas = document.getElementById("webgl-canvas");
    const colorMenu = document.getElementById("colorMenu");
    const clearMenu = document.getElementById("clearMenu");
    const clearButton = document.getElementById("clearButton");
    const pointModeButton = document.getElementById("pointModeButton");
    const triangleModeButton = document.getElementById("triangleModeButton");
    const circleModeButton = document.getElementById("circleModeButton");
    const bezierModeButton = document.getElementById("bezierModeButton");

    const gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser does not support WebGL");
        return;
    }

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

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Dynamic arrays for permanent shapes
    let trianglePositions = [];
    let triangleColors = [];
    let linePositions = [];
    let lineColors = [];

    // Arrays for helper points (temporary)
    let helperPositions = [];
    let helperColors = [];

    let drawingMode = "point";
    let tempPoints = [];
    let tempColors = [];
    let circleCenter = null;
    let centerColor = null;

    function resetTempData() {
        tempPoints = [];
        tempColors = [];
        circleCenter = null;
        centerColor = null;
    }

    pointModeButton.onclick = () => { drawingMode = "point"; resetTempData(); };
    triangleModeButton.onclick = () => { drawingMode = "triangle"; resetTempData(); };
    circleModeButton.onclick = () => { drawingMode = "circle"; resetTempData(); };
    bezierModeButton.onclick = () => { drawingMode = "bezier"; resetTempData(); };

    clearButton.onclick = function() {
        const clearColorIndex = clearMenu.selectedIndex;
        const bgcolor = colors[clearColorIndex];
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Clear all arrays
        trianglePositions = [];
        triangleColors = [];
        linePositions = [];
        lineColors = [];
        helperPositions = [];
        helperColors = [];

        resetTempData();
    };

    canvas.addEventListener("click", function(ev) {
        var bbox = ev.target.getBoundingClientRect();
        var x = 2 * (ev.clientX - bbox.left) / canvas.width - 1;
        var y = 2 * (canvas.height - (ev.clientY - bbox.top) - 1) / canvas.height - 1;
        var colorSelected = colors[colorMenu.selectedIndex];

        if (drawingMode === "point") {
            // Just add a small square point permanently (no helpers needed)
            addPointAsSquare(x, y, colorSelected, false);
        } else if (drawingMode === "triangle") {
            // Wait until we have 3 points
            tempPoints.push([x, y]);
            tempColors.push(colorSelected);
            // Show a helper point
            addPointAsSquare(x, y, colorSelected, true);
            if (tempPoints.length === 3) {
                // Finalize the triangle
                addTriangle(tempPoints, tempColors);
                // Clear helper points since the shape is done
                finalizeShape();
            }
        } else if (drawingMode === "circle") {
            if (!circleCenter) {
                circleCenter = [x, y];
                centerColor = colorSelected;
                addPointAsSquare(x, y, colorSelected, true);
            } else {
                const radius = Math.sqrt((x - circleCenter[0])**2 + (y - circleCenter[1])**2);
                drawCircle(circleCenter, radius, colorSelected, centerColor);
                finalizeShape();
            }
        } else if (drawingMode === "bezier") {
            tempPoints.push([x, y]);
            tempColors.push(colorSelected);
            addPointAsSquare(x, y, colorSelected, true);
            if (tempPoints.length === 3) {
                // Draw the Bezier curve
                drawQuadraticBezierCurve(tempPoints[0], tempPoints[1], tempPoints[2], colorSelected);
                finalizeShape();
            }
        }

        redraw();
    });

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // --- Helper Functions ---

    function addTriangle(points, colors) {
        for (let i = 0; i < 3; i++) {
            addTriangleVertex(points[i], colors[i]);
        }
    }

    function drawCircle(center, radius, outerColor, cColor) {
        const numSegments = 100;
        const angleIncrement = 2 * Math.PI / numSegments;
        for (let i = 0; i < numSegments; i++) {
            const angle1 = i * angleIncrement;
            const angle2 = (i + 1) * angleIncrement;
            const x1 = center[0] + radius * Math.cos(angle1);
            const y1 = center[1] + radius * Math.sin(angle1);
            const x2 = center[0] + radius * Math.cos(angle2);
            const y2 = center[1] + radius * Math.sin(angle2);

            addTriangleVertex(center, cColor);
            addTriangleVertex([x1, y1], outerColor);
            addTriangleVertex([x2, y2], outerColor);
        }
    }

    function drawQuadraticBezierCurve(p0, p1, p2, color) {
        const segments = 50;
        let prev = p0;
        for (let i = 1; i <= segments; i++) {
            let t = i / segments;
            let x = (1 - t)*(1 - t)*p0[0] + 2*(1 - t)*t*p1[0] + t*t*p2[0];
            let y = (1 - t)*(1 - t)*p0[1] + 2*(1 - t)*t*p1[1] + t*t*p2[1];

            addLineSegment(prev, [x, y], color);
            prev = [x, y];
        }
    }

    function addLineSegment(p1, p2, color) {
        addLineVertex(p1, color);
        addLineVertex(p2, color);
    }

    // This function adds a small square. If 'isHelper' is true, it goes into helper arrays.
    // If false, it goes into the main triangle arrays.
    function addPointAsSquare(x, y, color, isHelper) {
        if (isHelper) {
            offset = 0.005;
        } else {
            offset = 0.03;
        }
        
        const topLeft = [x - offset, y + offset];
        const topRight = [x + offset, y + offset];
        const bottomRight = [x + offset, y - offset];
        const bottomLeft = [x - offset, y - offset];

        // 6 vertices forming two triangles
        addVertexToArrays(topLeft, color, false, isHelper);
        addVertexToArrays(topRight, color, false, isHelper);
        addVertexToArrays(bottomRight, color, false, isHelper);

        addVertexToArrays(topLeft, color, false, isHelper);
        addVertexToArrays(bottomRight, color, false, isHelper);
        addVertexToArrays(bottomLeft, color, false, isHelper);
    }

    function addTriangleVertex([x, y], color) {
        // Add to main triangle arrays
        trianglePositions.push(x, y);
        triangleColors.push(...color);
    }

    function addLineVertex([x, y], color) {
        linePositions.push(x, y);
        lineColors.push(...color);
    }

    // If isHelper is true, this vertex goes to helper arrays. Otherwise, to triangle arrays.
    // lineMode is false here because helper points are always drawn as filled squares (triangles).
    function addVertexToArrays([x, y], color, lineMode, isHelper) {
        if (isHelper) {
            helperPositions.push(x, y);
            helperColors.push(...color);
        } else {
            // If not helper and lineMode=false => triangle arrays
            trianglePositions.push(x, y);
            triangleColors.push(...color);
        }
    }

    function finalizeShape() {
        // The shape is done, clear helper arrays so helper points vanish.
        helperPositions = [];
        helperColors = [];
        resetTempData();
        redraw();
    }

    function redraw() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        const triangleCount = trianglePositions.length / 2;
        const lineCount = linePositions.length / 2;
        const helperCount = helperPositions.length / 2;

        const totalPositions = trianglePositions.length + linePositions.length + helperPositions.length;
        const totalColors = triangleColors.length + lineColors.length + helperColors.length;

        const combinedPositions = new Float32Array(totalPositions);
        combinedPositions.set(trianglePositions, 0);
        combinedPositions.set(linePositions, trianglePositions.length);
        combinedPositions.set(helperPositions, trianglePositions.length + linePositions.length);

        const combinedColors = new Float32Array(totalColors);
        combinedColors.set(triangleColors, 0);
        combinedColors.set(lineColors, triangleColors.length);
        combinedColors.set(helperColors, triangleColors.length + lineColors.length);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, combinedPositions, gl.DYNAMIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, combinedColors, gl.DYNAMIC_DRAW);

        const a_Position = gl.getAttribLocation(program, "a_Position");
        const a_Color = gl.getAttribLocation(program, "a_Color");

        // Positions
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Colors
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        // Draw Triangles
        if (triangleCount > 0) {
            gl.drawArrays(gl.TRIANGLES, 0, triangleCount);
        }

        // Draw Lines (immediately after triangles)
        if (lineCount > 0) {
            gl.drawArrays(gl.LINES, triangleCount, lineCount);
        }

        // Draw Helper Points (as triangles after lines)
        if (helperCount > 0) {
            gl.drawArrays(gl.TRIANGLES, triangleCount + lineCount, helperCount);
        }
    }
};