

export function buildRenderPassDescription(textureView: GPUTextureView, clearValue: any, loadValue: any, depthStencilView: GPUTextureView)
 {
    return {
        colorAttachments: [{
            view: textureView,
            clearValue: clearValue,
            loadValue:  loadValue,
            loadOp: 'clear',
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: depthStencilView,
            depthClearValue: 1.0,
            depthLoadOp:'clear',
            depthStoreOp: "store",
        }
    };
}

export function createRenderPass(renderPassDescription: GPURenderPassDescriptor,
                                    commandEncoder: GPUCommandEncoder,
                                    pipeline: GPURenderPipeline,
                                    vertexBuffer: GPUBuffer,
                                    colorBuffer: GPUBuffer,
                                    bindIndices: Array<number>,
                                    bindGroups: Array<GPUBindGroup>
    ): GPURenderPassEncoder{
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, colorBuffer);
    if (bindIndices != null && bindIndices.length) {
        for (let i = 0; i < bindIndices.length; i++) {
            renderPass.setBindGroup(bindIndices[i], bindGroups[i])
        }
    }
    return renderPass
}