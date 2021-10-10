import { Object3D } from "../core/Object3D";
import { Camera } from "../core/Camera";
import { GLContex } from "../core/GLType";
import { SmoothTool } from "../utils/SmoothTool";
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
        let colorDep = SmoothTool.random(0.98, 1.02);
        let colorRind = Math.floor(SmoothTool.random(0, Start.NORMAL_COLOR.length));
        this.color = [
            colorDep * Start.NORMAL_COLOR[colorRind][0],
            colorDep * Start.NORMAL_COLOR[colorRind][1],
            colorDep * Start.NORMAL_COLOR[colorRind][2]
        ];

        // 生成多边形数据
        let randSeed = Math.random();
        let d = this.genBuffer(
            .05 + randSeed * .02, 
            .01 + randSeed * .01 + Math.random() * .01, 
            .01 + randSeed * .01 + Math.random() * .01
        );

        this.vertexBuffer = this.gl.createBuffer();
        this.pointNum = d.length / 3;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(d), this.gl.STATIC_DRAW);
    }

    /**
     * 坐标
     */
    public pos:[number,number,number] = [0, 0, 0];

    /**
     * 指定长度的区间内生成固定点
     * 固定距离摆动
     * @param len 
     * @param num 
     * @param pow 
     * @param r
     */
    private genRandomPointD(
        len:number, 
        num:number, 
        pow:number, 
        r:number
    ):number[][] {

        let res = [];

        for (let i = 0; i < num; i++) {
            res.push([
                Math.floor(i * len / (num - 1)),
                (i % 2 ? 1 : -1) * pow + 
                (i % 2 ? 1 : 0) * (Math.random() - .5) * 2 * r,
                
            ]);
        }

        return res;
    }

    /**
     * 生成网格
     * @param r 半径
     * @param p 半径浮动
     * @param o 平滑程度
     * @param e 精度
     */
    public genBuffer(
        r:number, 
        p:number, 
        o:number = 1,
        e:number = Math.PI / 45
    ):number[] {

        const dir:number[] = [0, 0];
        const res:number[] = [0, 0, 0];

        // 点个数
        let num = Math.PI * 2 / e;

        // 生成抖动数据
        let d = this.genRandomPointD(num, 11, r / 3, p);

        // 闭合数据
        d[d.length - 1][1] = d[0][1];

        // 插值
        let m = SmoothTool.genSmoothLine(d, false, o);

        for (let i = 0; i < m.length; i++) {

            // 当前角度
            let th = i * 2 * Math.PI / m.length;

            // 参数方程求解
            dir[0] = Math.cos(th);
            dir[1] = Math.sin(th);

            res.push(dir[0] * (r + m[i]));
            res.push(dir[1] * (r + m[i]));
            res.push(0);
        }

        // 连接起始点
        res.push(res[3]);
        res.push(res[4]);
        res.push(res[5]);

        return res;
    }

    private time:number = SmoothTool.random(0, 10);

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