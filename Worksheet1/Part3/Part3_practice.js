window.onload = function init() {
    const canvas = document.getElementById('webgl-canvas');

    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('Your browser does not support webGL');
        return;
    }

    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    var bufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);

    var vertices_with_color = new Float32Array ([
        0.0, 0.0,   1.0, 0.0, 0.0, 1.0,
        1.0, 0.0,   0.0, 1.0, 0.0, 1.0,
        1.0, 1.0,   0.0, 0.0, 1.0, 1.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_with_color, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(a_Color);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}