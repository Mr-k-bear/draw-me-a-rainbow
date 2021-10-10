import { GLCanvas, GLCanvasOption } from "./GLCanvas";
import {GLContex} from "./GLType";

export {GLRenderer}

/**
 * WEBGl 渲染器
 * 控制 GL 对象的渲染
 */
class GLRenderer {

    /**
     * 使用的画布
     */
    public canvas: GLCanvas;

    /**
     * GL 上下文
     */
    public gl:GLContex;

    /**
     * WebGL 版本
     */
    public glVersion:number = 0;

    /**
     * 获取上下文
     */
    public getContext(){

        // 尝试 webgl2
        this.gl = this.canvas.can.getContext("webgl2");
        if (this.gl) {
            this.glVersion = 2;
            console.log("Render: Using WebGL2 :)");
        } else {

            // 尝试 WebGL1
            this.gl = this.canvas.can.getContext("webgl");
            if (this.gl){
                this.glVersion = 1;
                console.log("Render: Using WebGL1 :(");
            }

            // 获取失败发出警告
            else {
                console.error("Render: Not supported WebGL!");
            }
        }
    }

    /**
     * 清屏颜色
     */
    public cleanColor:[number,number,number,number] = [.92, .92, .92, 1.];

    /**
     * 清屏
     */
    public clean(){
        this.gl.clearColor(
            this.cleanColor[0], this.cleanColor[1],
            this.cleanColor[2], this.cleanColor[3]
        );
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 构造
     */
    public constructor(canvas?:HTMLCanvasElement, canvasOp?:GLCanvasOption){

        this.canvas = new GLCanvas(canvas, canvasOp);

        // 获取上下文
        this.getContext();
    }

}