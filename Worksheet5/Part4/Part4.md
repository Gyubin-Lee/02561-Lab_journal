### Explanation for Normals

#### Purpose of Normals
Normals are vectors perpendicular to a surface, and they are essential for calculating how light interacts with that surface. They are used in lighting calculations to determine the diffuse and specular components of the Phong illumination model. 

#### Interpolated Normals
For smooth shading, normals are interpolated between vertices. This means that instead of using a single normal for the entire triangle (as in flat shading), each pixel within the triangle has its own normal, calculated by interpolating the vertex normals. This ensures gradual changes in lighting across the surface, creating a smoother visual effect even on meshes with relatively few triangles.

#### Surface Smoothness
Interpolated normals give the illusion of a curved and smooth surface, even when the underlying mesh consists of flat triangles. This is a key feature of Phong shading, which enhances the realism of 3D objects.