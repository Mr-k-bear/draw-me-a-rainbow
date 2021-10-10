import { Object3D } from "../core/Object3D";
import { GLContex } from "../core/GLType";
import { Camera } from "../Rainbow";
import { BasicsShader } from "../shader/BasicShader";

export {TestBox}

class TestBox implements Object3D{

    /**
     * 立方体数据
     */
    static CUBE_VER_DATA = new Float32Array([
        1,1,1,   -1,1,1,   -1,1,-1,    1,1,-1,
        1,-1,1,  -1,-1,1,  -1,-1,-1,   1,-1,-1
    ]);

    /**
     * 立方体线段绘制索引
     */
    static CUBE_ELE_DATA = new Uint16Array([
        0,1,  1,2,  2,3,  3,0,
        4,5,  5,6,  6,7,  7,4,
        0,4,  1,5,  2,6,  3,7
    ]);

    protected onload() {

        // 创建缓冲区
        this.cubeVertexBuffer = this.gl.createBuffer();
        this.cubeElementBuffer = this.gl.createBuffer();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, TestBox.CUBE_VER_DATA, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeElementBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, TestBox.CUBE_ELE_DATA, this.gl.STATIC_DRAW);
    }

    /**
     * GL 上下文
     */
    protected gl:GLContex;

    /**
     * 创建编译 shader
     */
    public constructor(gl:GLContex){
        this.gl = gl;
        this.onload();
    }
    
    private cubeVertexBuffer:WebGLBuffer;
    private cubeElementBuffer:WebGLBuffer;

    /**
     * 绘制半径
     */
    private r:[number,number,number] = [1,1,1];

    /**
     * 绘制立方体
     */
    public draw(camera:Camera, shader:BasicsShader){

        // 使用程序
        shader.use();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeElementBuffer);

        // 指定指针数据
        this.gl.vertexAttribPointer(
            shader.attribLocate("vPos"),
            3, this.gl.FLOAT, false, 0, 0);

        // mvp参数传递
        shader.mvp(camera.transformMat);

        // 半径传递
        shader.r(this.r);
        shader.pos([0, 0, 0]);

        // 指定颜色
        shader.color([.2, .2, .2]);

        // 开始绘制
        this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_SHORT, 0);
    }
}