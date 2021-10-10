import { Object3D } from "../core/Object3D";
import { Camera } from "../core/Camera";
import { GLContex } from "../core/GLType";
import { SmoothTool } from "../utils/SmoothTool";
import { FlutterShader } from "../shader/FlutterShader";

export { Planet }

class Planet implements Object3D {

    /**
     * GL 上下文
     */
    protected gl:GLContex;

    private vertexBuffer:WebGLBuffer;
    private pointNum:number;


    static readonly NORMAL_COLOR:number[] = 
    [111 / 255, 149 / 255, 191 / 255];

    /**
     * 加载
     */
    public constructor(gl:GLContex){
        this.gl = gl;

        // 随机颜色
        let colorDep = SmoothTool.random(0.98, 1.02);
        this.color = [
            colorDep * Planet.NORMAL_COLOR[0],
            colorDep * Planet.NORMAL_COLOR[1],
            colorDep * Planet.NORMAL_COLOR[2]
        ];

        // 生成多边形数据
        let randSeed = Math.random();
        let d = this.genBuffer(
            .20 + randSeed * .4, 
            .03 + randSeed * .03 + Math.random() * .01, 
            Math.floor(SmoothTool.random(5, 9)),
            .8 + randSeed * .3 + Math.random() * .1
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
     * 固定距离随机摆动
     * @param len 
     * @param num 
     * @param pow 
     */
    private genRandomPointM(len:number,num:number,pow:number):number[][] {

        let res = [];

        for (let i = 0; i < num; i++) {
            res.push([
                Math.floor(i * len / (num - 1)),
                (Math.random() - .5) * 2 * pow
            ]);
        }

        return res;
    }

    /**
     * 生成网格
     * @param r 半径
     * @param p 半径浮动
     * @param f 浮动频率
     * @param o 平滑程度
     * @param e 精度
     */
    public genBuffer(
        r:number, 
        p:number, 
        f:number, 
        o:number = 1,
        e:number = Math.PI / 45
    ):number[] {

        const dir:number[] = [0, 0];
        const res:number[] = [0, 0, 0];

        // 点个数
        let num = Math.PI * 2 / e;

        // 生成抖动数据
        let d = this.genRandomPointM(num, f, p);

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