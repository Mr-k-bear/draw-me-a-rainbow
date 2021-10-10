import { BasicsShader, Camera, Object3D } from "../Rainbow";
import { GLContex } from "../core/GLType";

export { TestAxis };

class TestAxis implements Object3D{

    /**
     * 坐标轴数据
     */
    static AXIS_VER_DATA = new Float32Array([
        0,0,0,  1,0,0,
        0,0,0,  0,1,0,
        0,0,0,  0,0,1
    ]);

    private axisVertexBuffer:WebGLBuffer;

    protected onload() {

        // 创建缓冲区
        this.axisVertexBuffer = this.gl.createBuffer();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axisVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, TestAxis.AXIS_VER_DATA, this.gl.STATIC_DRAW);
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

    /**
     * 绘制半径
     */
    public r:number = 1;

    public pos:number[] = [0, 0, 0];

    /**
     * 绘制坐标轴
     */
    public draw(camera:Camera, shader:BasicsShader){

        // 使用程序
        shader.use();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axisVertexBuffer);

        // 指定指针数据
        this.gl.vertexAttribPointer(
            shader.attribLocate("vPos"),
            3, this.gl.FLOAT, false, 0, 0);

        // mvp参数传递
        shader.mvp(camera.transformMat);

        // 半径传递
        shader.r([this.r, this.r, this.r]);
        shader.pos(this.pos);

        // 绘制 X 轴
        shader.color([1, 0, 0]);
        this.gl.drawArrays(this.gl.LINES, 0, 2);

        // 绘制 Y 轴
        shader.color([0, 1, 0]);
        this.gl.drawArrays(this.gl.LINES, 2, 2);

        // 绘制 Z 轴
        shader.color([0, 0, 1]);
        this.gl.drawArrays(this.gl.LINES, 4, 2);
    }
}