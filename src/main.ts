import './style.css'
import { Cube } from './cube'
import { GPU } from './gpu'
import { createGPUBuffer } from './gpuBuffer';
import { createPipeline } from './pipeline';
import shader from './shader.wgsl?raw';
import { vec3, mat4 } from 'gl-matrix';
import { buildRenderPassDescription, createRenderPass } from './renderpass'
import { createViewProjection } from './viewProjection';
import { createTransforms } from './transform';

const BACKGROUND = { r: 0.25, g: 0.25, b: 0.3, a: 1.0 }

const gpu = new GPU()
let message = gpu.getStatusMessage()

const createCamera = require('3d-view-controls');

const refreshCanvas = (drawFunction:any) => {
    function step() {
        drawFunction();
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

const createCube = async () => {
    if (!gpu.getStatus()) return;

    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const device = await gpu.requestDevice()

    // create vertex buffers
    const cube = Cube();
    const numberOfVertices: number = cube.positions.length / 3;
    const vertexBuffer: GPUBuffer  = createGPUBuffer(device, cube.positions);
    const colorBuffer: GPUBuffer   = createGPUBuffer(device, cube.colors);

    // create pipeline
    const pipeline: GPURenderPipeline = createPipeline({ device, format: gpu.getFormat(), shader })

    // create uniform data
    const modelMatrix: mat4 = mat4.create();
    const mvpMatrix: mat4 = mat4.create();
    let vMatrix: mat4 = mat4.create();
    let vpMatrix: mat4 = mat4.create();
    const vp = createViewProjection(canvas.width/canvas.height);
    vpMatrix = vp.viewProjectionMatrix;

    // create camera
    var camera = createCamera(canvas, vp.cameraOption);

    // create uniform buffer and bind group
    let matrixSize = mvpMatrix.length * Float32Array.BYTES_PER_ELEMENT;

    const uniformBuffer = device.createBuffer({
        size: matrixSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBindGroup: GPUBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: matrixSize
            }
        }]
    });

    const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
    context.configure({
        device: device,
        format: gpu.getFormat(),
        alphaMode:'opaque'
    });

    let textureView =  context.getCurrentTexture().createView();
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const renderPassDescription = buildRenderPassDescription(textureView, BACKGROUND, BACKGROUND, depthTexture.createView());

    let rotation: vec3 = vec3.fromValues(0, 0, 0);
    let translation: vec3 = vec3.fromValues(0, 0, 0);

    function render() {
        if(camera.tick()){
            const pMatrix = vp.projectionMatrix;
            vMatrix = camera.matrix;
            mat4.multiply(vpMatrix, pMatrix, vMatrix);
        }

        createTransforms(modelMatrix, translation, rotation);
        mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);
        device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as ArrayBuffer);
        textureView = context.getCurrentTexture().createView();

        renderPassDescription.colorAttachments[0].view = textureView;
        const commandEncoder = device.createCommandEncoder();

        const renderPass = createRenderPass(renderPassDescription as GPURenderPassDescriptor, commandEncoder,
            pipeline, vertexBuffer,
            colorBuffer, [0], [uniformBindGroup]);
 
        renderPass.draw(numberOfVertices);
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
    }
    refreshCanvas(render);
}

createCube();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<div><p> ` + message + `</p></div>`
