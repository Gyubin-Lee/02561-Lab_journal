// Wait until the window is loaded
window.onload = function initWebGL() {
    // Get the canvas element
    const canvas = document.getElementById('webgl-canvas');

    // Initialize WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    // Set the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas with a cornflower blue color (0.3921, 0.5843, 0.9294, 1.0)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // More WebGL setup will go here (shaders, buffers, rendering, etc.)
};