import { Object3D } from "../core/Object3D";
import { Camera } from "../core/Camera";
import { GLContex } from "../core/GLType";
import { Bezier3Point } from "../utils/SmoothTool";
import { FlutterShader } from "../shader/FlutterShader";
import { RainbowShader } from "../Rainbow";

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
    private vertexPosBuffer:WebGLBuffer;
    private vertexDirBuffer:WebGLBuffer;
    private vertexTimeBuffer:WebGLBuffer;
    private pointNum:number = 0;

    /**
     * 最大顶点个数
     */
    public maxVertexNum = 1024 * 2;

    ///////////////// START 曲线生成算法 START //////////////////////

    /**
     * 最小限制角度
     */
    public minAngle:number = Math.PI / 180;

    /**
     * 上次的向量
     */
    private lastVector:number[] = [NaN, NaN];

    /**
     * 彩虹半径
     */
    public r:number = .25;

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
        let dir = [
            nx * 0 - ny * 1,
            ny * 0 + nx * 1
        ];

        // 生成主路径数据
        let nextX = this.pathMain[this.pathMain.length - 3] + nx * dis;
        let nextY = this.pathMain[this.pathMain.length - 2] + ny * dis;

        // js 内存
        this.pathMain.push(nextX);
        this.pathMain.push(nextY);
        this.pathMain.push(0);

        // 法线拓展
        this.updateVertexDate([
            nextX, nextY, 0,
            dir[0], dir[1], 0, 1
        ]);

        this.updateVertexDate([
            nextX, nextY, 0,
            - dir[0], - dir[1], 0, 0
        ]);

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

        // 坐标缓冲
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPosBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.pointNum * 12, new Float32Array([
            arr[0], arr[1], arr[2]
        ]));

        // 方向缓冲
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexDirBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.pointNum * 12, new Float32Array([
            arr[3], arr[4], arr[5]
        ]));

        // 时间缓冲
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTimeBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.pointNum * 8, new Float32Array([
            arr[6], this.time
        ]));

        this.pointNum += 1;

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
     * 生成点集数据
     */
    private genRangeSwing(){

        return Bezier3Point.genRangeSwing(
            .05 + .08 * Math.random(), 
            3 + Math.floor(Math.random() * 3), 
            50 + Math.random() * 100, 
            -.15 - Math.random() * .1
        );
    }

    /**
     * 生成随机摆线自动绘制
     */
    public autoDraw(){

        // 重置索引
        this.autoDrawIndex = 0;

        // 生成随机摆线
        let swingPoint = this.genRangeSwing();

        // console.log(swingPoint);

        // 曲线生成
        this.autoDrawFocus = Bezier3Point.genSmoothLine(swingPoint);

        // 开启自动绘制
        this.isAutoDraw = true;
    }

    /**
     * 测试点集的生成情况
     * 这个函数通常测试使用
     */
    public testDrawBezierPoint() {

        // 生成随机摆线
        let swingPoint = this.genRangeSwing();

        // 转换为点集数据
        // let data = Bezier3Point.bezierPoint2Vertex(swingPoint);
        let data = Bezier3Point.genSmoothLine(swingPoint);

        // 上传数据
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPosBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.pointNum * 12, new Float32Array(data));

        this.pointNum += data.length;

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
    public constructor(gl:GLContex, maxVertexNum?:number){

        this.gl = gl;

        // 最大顶点数量
        // 决定了彩虹的长度
        if (maxVertexNum !== undefined) 
        this.maxVertexNum = maxVertexNum;

        // 随机颜色
        this.color = [.5, .5, .5];

        // 生成随机的半径
        this.r = .15 + .1 * Math.random();

        // 随机时间相位
        this.time = 
        this.timeStart = 
        this.timeEnd =
        Bezier3Point.random(0, 10);

        // 创建位置缓冲区
        this.vertexPosBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPosBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.maxVertexNum * 3, this.gl.DYNAMIC_DRAW);

        // 创建方向缓冲区
        this.vertexDirBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexDirBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.maxVertexNum * 3, this.gl.DYNAMIC_DRAW);

        // 创建时间缓冲区
        this.vertexTimeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTimeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.maxVertexNum * 2, this.gl.DYNAMIC_DRAW);
    }

    /**
     * 坐标
     */
    public pos:[number,number,number] = [0, 0, 0];

    /**
     * 随机时间相位
     */
    private time:number;

    /**
     * 起始时间
     */
    private timeStart:number;

    /**
     * 结束时间
     */
     private timeEnd:number;

    /**
     * 绘制颜色
     */
    public color:number[];

    /**
     * 更新
     * @param t dt
     */
    public update(t:number){
        
        this.time += t ?? 0;

        // 自动绘制
        if (this.isAutoDraw) {

            // 获取下一个点
            let next = this.nextAutoVecter();

            if (next !== null) this.extendVector(next[0], next[1]);

            this.timeEnd = this.time;
        }
    }
    
    public draw(camera:Camera, shader:RainbowShader){

        // 使用程序
        shader.use();

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPosBuffer);

        // 指定指针数据
        this.gl.vertexAttribPointer(
            shader.attribLocate("vPos"),
            3, this.gl.FLOAT, false, 0, 0);

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexDirBuffer);

        // 指定指针数据
        this.gl.vertexAttribPointer(
            shader.attribLocate("vDir"),
            3, this.gl.FLOAT, false, 0, 0);

        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTimeBuffer);

        this.gl.vertexAttribPointer(
            shader.attribLocate("vIdx"),
            1, this.gl.FLOAT, false, 2 * 4, 0);

        this.gl.vertexAttribPointer(
            shader.attribLocate("vTime"),
            1, this.gl.FLOAT, false, 2 * 4, 1 * 4);

        // mvp参数传递
        shader.mvp(camera.transformMat);

        // 半径
        shader.r(this.r);

        // 时间
        shader.t(this.time);
        shader.tStart(this.timeStart);
        shader.tEnd(this.timeEnd);

        // 半径传递
        shader.color(this.color);
        shader.pos(this.pos);

        // 开始绘制
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.pointNum);
        // this.gl.drawArrays(this.gl.LINE_LOOP, 0, this.pointNum);
    }
}