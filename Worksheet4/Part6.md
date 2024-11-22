### Part 6: Answers

#### a) What is the difference between Phong shading and Phong lighting (the Phong reflection model)?
- **Phong Lighting**: Refers to the reflection model used to calculate the light interaction at a surface point. It involves computing ambient, diffuse, and specular lighting based on material and light properties.
- **Phong Shading**: Refers to the shading technique where the lighting calculations are done in the fragment shader for each pixel using interpolated surface normals. This results in smooth lighting and highlights across the surface.

#### b) What is the difference between flat shading, Gouraud shading, and Phong shading? List pros and cons of each. Is Gouraud or Phong shading the best method for simulating highlights? Explain.
- **Flat Shading**:
  - **Description**: Lighting is calculated once per polygon using a single normal vector, and the result is applied uniformly across the polygon.
  - **Pros**: Simple, fast to compute.
  - **Cons**: Produces faceted appearances, not suitable for smooth surfaces.
  
- **Gouraud Shading**:
  - **Description**: Lighting is calculated at each vertex, and the results are interpolated across the surface of the polygon.
  - **Pros**: Produces smoother results than flat shading; efficient for simple lighting.
  - **Cons**: Highlights may be missed if they fall between vertices.

- **Phong Shading**:
  - **Description**: Lighting is calculated per pixel in the fragment shader using interpolated normals.
  - **Pros**: Produces very smooth and realistic highlights; accurate rendering of curved surfaces.
  - **Cons**: More computationally expensive than Gouraud shading.

- **Best for highlights**: Phong shading is better for simulating highlights as it calculates lighting at the pixel level, ensuring smooth and accurate highlights even between vertices.

#### c) What is the difference between a directional light and a point light?
- **Directional Light**: Represents light with parallel rays originating from a distant source (e.g., the Sun). It has a direction but no position.
- **Point Light**: Represents a light source that emits rays in all directions from a specific position in space (e.g., a bulb). Its intensity decreases with distance.

#### d) Does the eye position influence the shading of an object in any way?
- Yes, the eye position influences the specular highlights of an object. The reflection vector depends on the eye position, and the specular term in the lighting model uses the angle between the view direction and the reflection direction to calculate the intensity of highlights.

#### e) What is the effect of setting the specular term to (0, 0, 0)?
- Setting the specular term to (0, 0, 0) removes specular highlights, resulting in a matte appearance. The object will only show diffuse and ambient lighting effects.

#### f) What is the effect of increasing the shininess exponent (α)?
- Increasing the shininess exponent (α) makes the specular highlights smaller and sharper. This simulates smoother and more reflective surfaces.

#### g) In what coordinate space did you compute the lighting?
- Lighting was computed in world space. The normals, light directions, and view vectors were transformed into world coordinates for consistent calculations.