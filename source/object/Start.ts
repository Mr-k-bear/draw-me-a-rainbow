import { Object3D } from "../core/Object3D";
import { Camera } from "../core/Camera";
import { GLContex } from "../core/GLType";
import { Bezier3Point } from "../utils/SmoothTool";
import { FlutterShader } from "../shader/FlutterShader";

export { Start }

class Start implements Object3D {

    /**
     * GL 上下文
     */
    protected gl:GLContex;

    private vertexBuffer:WebGLBuffer;
    private pointNum:number;

    static readonly NORMAL_COLOR:number[][] = [
        [253 / 255, 255 / 255, 252 / 255],
        [255 / 255, 244 / 255, 187 / 255],
        [255 / 255, 204 / 255, 167 / 255]
    ];

    /**
     * 加载
     */
    public constructor(gl:GLContex){

        this.gl = gl;

        // 随机颜色
        let colorDep = Bezier3Point.random(0.98, 1.02);
        let colorRind = Math.floor(Bezier3Point.random(0, Start.NORMAL_COLOR.length));
        this.color = [
            colorDep * Start.NORMAL_COLOR[colorRind][0],
            colorDep * Start.NORMAL_COLOR[colorRind][1],
            colorDep * Start.NORMAL_COLOR[colorRind][2]
        ];

        // 生成多边形数据
        let randSeed = Math.random();
        let randomParam:number[] = [
            .05 + randSeed * .02, 
            .005 + randSeed * .005 + Math.random() * .001,
            10, .02, Math.PI / 30
        ];

        // 生成随机圆形点
        let circle = Bezier3Point.genCycleIsometricCircle.apply(Bezier3Point, randomParam);

        // 生成多边形数据
        let data = Bezier3Point.genSmoothLine(circle);
        // let data = Bezier3Point.bezierPoint2Vertex(circle);

        // 处理圆形数据
        data = Bezier3Point.processCircularData(data);

        this.vertexBuffer = this.gl.createBuffer();
        this.pointNum = data.length / 3;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    }

    /**
     * 坐标
     */
    public pos:[number,number,number] = [0, 0, 0];

    private time:number = Bezier3Point.random(0, 100);

    public color:number[];

    public update(t:number){
        
        this.time += t ?? 0;
    }
    
    public draw(camera:Camera, shader:FlutterShader){

        // 使用程序
        shader.use();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

        // 指定指针数据
        this.gl.vertexAttribPointer(
            shader.attribLocate("vPos"),
            3, this.gl.FLOAT, false, 0, 0);

        // mvp参数传递
        shader.mvp(camera.transformMat);

        // 时间
        shader.t(this.time);

        // 半径传递
        shader.color(this.color);
        shader.pos(this.pos);

        // 开始绘制
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.pointNum);
    }
}