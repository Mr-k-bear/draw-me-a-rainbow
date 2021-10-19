import { Object3D } from "../core/Object3D";
import { Camera } from "../core/Camera";
import { GLContex } from "../core/GLType";
import { Bezier3Point } from "../utils/SmoothTool";
import { FlutterShader } from "../shader/FlutterShader";

export { Rainbow }

class Rainbow implements Object3D {

    /**
     * GL 上下文
     */
    protected gl:GLContex;

    static readonly NORMAL_COLOR:number[][] = [
        [253 / 255, 180 / 255, 197 / 255],
        [255 / 255, 204 / 255, 167 / 255],
        [255 / 255, 236 / 255, 181 / 255],
        [141 / 255, 247 / 255, 176 / 255],
        [135 / 255, 187 / 255, 252 / 255],
        [208 / 255, 192 / 255, 243 / 255]
    ];

    /**
     * 主要路径
     */
    private pathMain:number[] = [0, 0, 0];

    /**
     * 多边形顶点数据
     */
    private vertexArray:number[] = [];
    private vertexBuffer:WebGLBuffer;
    private pointNum:number = 0;

    /**
     * 最大缓冲区大小
     */
    public maxVertexNum = 1024 * 3;

    ///////////////// START 曲线生成算法 START //////////////////////

    /**
     * 最小限制角度
     */
    public minAngle:number = Math.PI / 60;

    /**
     * 上次的向量
     */
    private lastVector:number[] = [NaN, NaN];

    /**
     * 使用向量延长路径
     */
    public extendVector(x:number, y:number) {

        // 计算位移距离
        let dis = (x**2 + y**2) ** .5;

        // 如果向量没有位移 阻止下面计算
        if (dis <= 0) return;

        // 归一化向量
        let nx = x / dis;
        let ny = y / dis;

        // 如果上次有向量了
        if (!isNaN(this.lastVector[0]) && !isNaN(this.lastVector[1])) {

            // 计算夹角
            let th = this.lastVector[0] * nx + this.lastVector[1] * ny;

            // console.log(this.lastVector[0],this.lastVector[1], nx, ny);

            // 计算弧度
            let cl = Math.acos(th);

            // console.log(cl, this.minAngle);

            // 如果超出角度
            if (cl > this.minAngle) {

                // 计算朝向
                let dp = (this.lastVector[0] * y - x * this.lastVector[1]) > 0 ? 1 : -1;

                // 旋转角度
                let rth = this.minAngle * dp;

                // 向量旋转
                nx = this.lastVector[0] * Math.cos(rth) - this.lastVector[1] * Math.sin(rth);
                ny = this.lastVector[1] * Math.cos(rth) + this.lastVector[0] * Math.sin(rth);
            }

        }

        // 计算两个方向的法线
        let dirUp = [
            nx * 0 - ny * 1,
            ny * 0 + nx * 1
        ];
        let dirDown = [
            nx * 0 - ny * (-1),
            ny * 0 + nx * (-1)
        ];

        // 生成主路径数据
        let nextX = this.pathMain[this.pathMain.length - 3] + nx * dis;
        let nextY = this.pathMain[this.pathMain.length - 2] + ny * dis;

        // js 内存
        this.pathMain.push(nextX);
        this.pathMain.push(nextY);
        this.pathMain.push(0);

        // gl 内存
        this.updateVertexDate([nextX, nextY, 0]);

        // 保存上次向量
        this.lastVector[0] = nx;
        this.lastVector[1] = ny;

    }

    /**
     * 上传数据到 gl
     * @param arr 数据数组
     */
    private updateVertexDate(arr:number[]) {

        if (this.pointNum >= this.maxVertexNum) return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.pointNum * 4, new Float32Array(arr));
        this.pointNum += arr.length;

    }

    /**
     * 自动绘图数据
     */
    private autoDrawFocus:number[];

    /**
     * 是否使用自动绘图
     */
    private isAutoDraw:boolean = false;

    /**
     * 生成随机摆线自动绘制
     */
    public autoDraw(){

        // 重置索引
        this.autoDrawIndex = 0;

        // 生成随机摆线
        let swingPoint = Bezier3Point.genRangeSwing(
            .05 + .05 * Math.random(), 
            6 + Math.floor(Math.random() * 10), 
            50 + Math.random() * 100, 
            .1 + Math.random() * .1
        );

        // 曲线生成
        this.autoDrawFocus = Bezier3Point.genSmoothLine(swingPoint);

        // 开启自动绘制
        this.isAutoDraw = true;
    }

    /**
     * 自动绘制索引
     */
    private autoDrawIndex = 0;

    /**
     * 获取下一个点
     */
    private nextAutoVecter():number[] {

        if (this.autoDrawIndex >= this.autoDrawFocus.length / 3)
        return null;

        let next = [
            this.autoDrawFocus[this.autoDrawIndex * 3],
            this.autoDrawFocus[this.autoDrawIndex * 3 + 1]
        ];

        this.autoDrawIndex ++;

        if (this.autoDrawIndex >= this.autoDrawFocus.length / 3)
        this.isAutoDraw = false;

        return next;
    }

    /////////////// END 曲线生成算法 END ////////////////////////

    /**
     * 初始化顶点
     */
    public constructor(gl:GLContex){

        this.gl = gl;

        // 随机颜色
        this.color = [.5, .5, .5];

        // 创建缓冲区
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.maxVertexNum, this.gl.DYNAMIC_DRAW);

        // 添加开始的三个点
        this.updateVertexDate([0,0,0]);
    }

    /**
     * 坐标
     */
    public pos:[number,number,number] = [0, 0, 0];

    private time:number = Bezier3Point.random(0, 10);

    public color:number[];

    public update(t:number){
        
        this.time += t ?? 0;

        // 自动绘制
        if (this.isAutoDraw) {

            // 获取下一个点
            let next = this.nextAutoVecter();

            if (next !== null) this.extendVector(next[0], next[1]);
        }
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
        this.gl.drawArrays(this.gl.LINE_LOOP, 0, this.pointNum / 3);
    }
}