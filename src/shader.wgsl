// vertex shader

struct Uniforms {
    mvpMatrix : mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct Vertex {
    @builtin(position) Position : vec4<f32>,
    @location(0) vColor : vec4<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Vertex {
    var vertex: Vertex;
    vertex.Position = uniforms.mvpMatrix * pos;
    vertex.vColor = color;
    return vertex;
}

// fragment shader

 @fragment
fn fs_main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
    return vColor;
}