window.onload = function init() {
    const canvas = document.getElementById('webgl-canvas');

    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}