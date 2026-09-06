#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float noise_gen3(vec3 point){
    return fract(sin(dot(point, vec3(12.9898, 78.233, 193.31419))) * 43758.5453);
}

float noise_gen2(vec2 point){
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise_gen2(float x, float y){
    return noise_gen2(vec2(x,y));
}
vec3 nearest_rng_point(vec3 point){
    //Random grid originating point, used for voronoi and worley shaders.
    //For every integer vec3, hashes an offset from 0-1 in all 3 axes.
    float min_dist = 10000000.0;
    vec3 min_point = vec3(0.1,0.,0.);//for some reason putting a 0.1 here changes something.
    for(int i = -1; i <= 1; i++){
        for(int j = -1; j <= 1; j++){
            for(int k = -1; k <= 1; k++){
                //Sample an offset consistent to all frag neighbors ( because of floor(`) )
                vec3 ivec = floor(point + vec3(i,j,k));
                float pz = noise_gen2(ivec.x,ivec.y);
                float py = noise_gen2(ivec.z,ivec.x);
                float px = noise_gen2(ivec.y,ivec.z);
                vec3 worley_point = ivec + vec3(px,py,pz);
                //The min dist for worley noise
                float worley_dist = distance(point, worley_point);
                if(worley_dist < min_dist){
                    min_dist = worley_dist;
                    min_point = worley_point;
                }

            }
        }   
    }
    return min_point;
}

float worley_noise_frag(vec3 point){
    //the distance to the point is worley noise.
    return distance(nearest_rng_point(point), point);
}

float voronoi_noise_frag(vec3 point){
    //A hash of the point creates a voronoi pattern.
    //TODO: floating point errors should affect this hash.
    //Not sure why they dont.
    vec3 rng_point = 1.*nearest_rng_point(point);
    return noise_gen3(rng_point);
}

float white_noise_frag(vec3 point){
    float scale = 4.0f;
    vec3 ivec = floor(point * scale);
    return noise_gen3(ivec);
}

void main()
{
        float noise = voronoi_noise_frag(   10.*fs_Pos.xyz);
        noise = max(noise, 0.f);
        vec4 diffuseColor = vec4(noise * u_Color.rgb, u_Color.a);

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        // diffuseTerm = clamp(diffuseTerm, 0, 1);

        float ambientTerm = 0.2;

        float lightIntensity = max(0.,diffuseTerm) + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
