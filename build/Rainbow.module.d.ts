import { EventEmitter } from 'events';
import * as M from 'gl-matrix';
import { vec3, mat4 } from 'gl-matrix';

/**
 * GLCanvas 的设置
 */
interface GLCanvasOption {
    /**
     * 分辨率自适应
     */
    autoResize?: boolean;
    /**
     * 是否监听鼠标事件
     */
    mouseEvent?: boolean;
    /**
     * 调试时使用
     * 打印事件
     */
    eventLog?: boolean;
}
/**
 * 封装 GLCanvas
 * 管理封装画布的功能属性
 * 监听画布事件
 *
 * @event resize 画布缓冲区大小改变
 * @event mousemove 鼠标移动
 * @event mouseup 鼠标抬起
 * @event mousedown 鼠标按下
 */
declare class GLCanvas extends EventEmitter {
    /**
     * HTML节点
     */
    private readonly canvas;
    private readonly div;
    /**
     * 获取节点
     */
    get dom(): HTMLDivElement;
    get can(): HTMLCanvasElement;
    /**
     * 像素分辨率
     */
    pixelRatio: number;
    /**
     * 帧缓冲区宽度
     */
    get width(): number;
    /**
     * 帧缓冲区高度
     */
    get height(): number;
    /**
     * 画布宽度
     */
    get offsetWidth(): number;
    /**
     * 画布高度
     */
    get offsetHeight(): number;
    /**
     * 缩放 X
     */
    get scaleX(): number;
    /**
     * 缩放 Y
     */
    get scaleY(): number;
    /**
     * 分辨率 (画布宽高比)
     */
    get ratio(): number;
    /**
     * 缓存判断是否要设置 canvas 大小
     */
    private readonly offsetFlg;
    /**
     * 画布大小适应到 css 大小
     */
    resize(): void;
    /**
     * 鼠标 X 坐标
     */
    mouseX: number;
    /**
     * 鼠标 Y 坐标
     */
    mouseY: number;
    /**
     * 鼠标相对 X 坐标
     */
    mouseUvX: number;
    /**
     * 鼠标相对 Y 坐标
     */
    mouseUvY: number;
    /**
     * 鼠标 GLX 坐标
     */
    mouseGlX: number;
    /**
     * 鼠标 GLY 坐标
     */
    mouseGlY: number;
    /**
     * 鼠标 X 变化量
     */
    mouseMotionX: number;
    /**
     * 鼠标 Y 变化量
     */
    mouseMotionY: number;
    /**
     * 缓存鼠标位置
     */
    private readonly mouseFlg;
    /**
     * 保存鼠标数据
     */
    private calcMouseData;
    private calcMouseDataFromTouchEvent;
    /**
     * 鼠标触摸触发计数
     */
    private touchCount;
    /**
     * 鼠标是否按下
     */
    mouseDown: boolean;
    /**
     * 检测 canvas 变化
     */
    private readonly obs;
    /**
     * 使用 canvas 节点创建
     * 不适用节点则自动创建
     * @param ele 使用的 canvas节点
     * @param o 设置
     */
    constructor(ele?: HTMLCanvasElement, o?: GLCanvasOption);
}

/**
 * Gl 上下文类型
 */
declare type GLContex = WebGL2RenderingContext | WebGLRenderingContext;

/**
 * Shader类
 */
declare class GLProgram {
    /**
     * shader 使用的上下文
     */
    protected gl: GLContex;
    /**
     * 顶点着色器源码
     */
    protected vertexShaderSource: string;
    /**
     * 片段着色器源代码
     */
    protected fragmentShaderSource: string;
    /**
     * 顶点着色器
     */
    protected vertexShader: WebGLShader;
    /**
     * 片段着色器
     */
    protected fragmentShader: WebGLShader;
    /**
     * 程序
     */
    protected program: WebGLProgram;
    /**
     * 设置源代码
     */
    protected setSource(vert: string, frag: string): this;
    /**
     * 编译
     */
    protected compile(): this;
    /**
     * 创建编译 shader
     */
    constructor(gl: GLContex);
    protected onload(): void;
    /**
     * attrib 位置缓存
     */
    private attribLocationCache;
    /**
     * attrib 位置缓存
     */
    private uniformLocationCache;
    /**
     * 获取 attribLocation
     */
    attribLocate(attr: string): number;
    /**
     * 获取 attribLocation
     */
    uniformLocate(uni: string): WebGLUniformLocation;
    /**
     * 使用程序
     */
    use(): this;
}

/**
 * 摄像机
 */
declare class Camera {
    private canvas;
    /**
     * 视点
     */
    eye: M.vec3;
    /**
     * 目标
     */
    target: M.vec3;
    /**
     * 镜头旋转方向
     */
    up: M.vec3;
    /**
     * 视野大小
     */
    range: number;
    /**
     * 画布宽高比例
     */
    ratio: number;
    /**
     * 进远平面距离
     */
    nearFar: M.vec2;
    /**
     * 观察者矩阵
     */
    viewMat: M.mat4;
    /**
     * 观察者矩阵
     */
    projectionMat: M.mat4;
    /**
     * 变换矩阵
     */
    transformMat: M.mat4;
    /**
     * 逆变换矩阵
     */
    transformNMat: M.mat4;
    /**
     * 构造函数设置初始值
     */
    constructor(canvas: GLCanvas);
    private tempRayPoint;
    private tempRayP;
    private tempRayO;
    /**
     * 生成变换需要的全部矩阵
     */
    generateMat(): void;
    /**
     * X 轴旋转角度
     * [0 - 360)
     */
    angleX: number;
    /**
     * Y 轴旋转角度
     * [90 - -90]
     */
    angleY: number;
    /**
     * 通过角度设置视点
     */
    setEyeFromAngle(): void;
    /**
     * 控制灵敏度
     */
    sensitivity: number;
    /**
     * 摄像机控制函数
     */
    ctrl(x: number, y: number): void;
    /**
     * 射线追踪
     */
    rayTrack(x: number, y: number): [M.vec3, M.vec3];
    /**
     * 极限追踪距离
     */
    EL: number;
    private scaleRay;
    /**
     * 计算射线与 XY 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineXYPlant(o: M.vec3, p: M.vec3, k?: number): M.vec3;
    /**
     * 计算射线与 XZ 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineXZPlant(o: M.vec3, p: M.vec3, k?: number): M.vec3;
    /**
     * 计算射线与 YZ 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineYZPlant(o: M.vec3, p: M.vec3, k?: number): M.vec3;
}

declare type LoopFunction = (t: number) => void;
/**
 * 时钟
 */
declare class Clock {
    /**
     * 总用时
     */
    private allTime;
    /**
     * 速率
     */
    speed: number;
    /**
     * fps监视器
     */
    private stats;
    /**
     * 是否使用 Stats
     */
    private isStatsOn;
    /**
     * 开启 fps 监视
     */
    useStats(): this;
    /**
     * 主函数
     */
    private fn;
    /**
     * 动画循环
     * @param fn 循环函数
     */
    constructor(fn?: LoopFunction);
    /**
     * 设置函数
     * @param fn 循环函数
     */
    setFn(fn: LoopFunction): void;
    /**
     * 开始
     */
    run(): void;
}

/**
 * WEBGl 渲染器
 * 控制 GL 对象的渲染
 */
declare class GLRenderer {
    /**
     * 使用的画布
     */
    canvas: GLCanvas;
    /**
     * GL 上下文
     */
    gl: GLContex;
    /**
     * WebGL 版本
     */
    glVersion: number;
    /**
     * 获取上下文
     */
    getContext(): void;
    /**
     * 清屏颜色
     */
    cleanColor: [number, number, number, number];
    /**
     * 清屏
     */
    clean(): void;
    /**
     * 构造
     */
    constructor(canvas?: HTMLCanvasElement, canvasOp?: GLCanvasOption);
}

/**
 * 3D物体
 */
interface Object3D {
    /**
     * 绘制方法
     */
    draw(...d: any): void;
}

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
declare class BasicsShader extends GLProgram {
    onload(): void;
    /**
     * 传递半径数据
     */
    r(r: number[] | vec3): this;
    /**
     * 坐标
     */
    pos(r: number[] | vec3): this;
    /**
     * 传递半径数据
     */
    mvp(mat: mat4, transpose?: boolean): this;
    /**
     * 传递半径数据
     * @param {vec3|Number[]} rgb
     */
    color(rgb: number[] | vec3): void;
}

declare class TestAxis implements Object3D {
    /**
     * 坐标轴数据
     */
    static AXIS_VER_DATA: Float32Array;
    private axisVertexBuffer;
    protected onload(): void;
    /**
     * GL 上下文
     */
    protected gl: GLContex;
    /**
     * 创建编译 shader
     */
    constructor(gl: GLContex);
    /**
     * 绘制半径
     */
    r: number;
    pos: number[];
    /**
     * 绘制坐标轴
     */
    draw(camera: Camera, shader: BasicsShader): void;
}

declare class TestBox implements Object3D {
    /**
     * 立方体数据
     */
    static CUBE_VER_DATA: Float32Array;
    /**
     * 立方体线段绘制索引
     */
    static CUBE_ELE_DATA: Uint16Array;
    protected onload(): void;
    /**
     * GL 上下文
     */
    protected gl: GLContex;
    /**
     * 创建编译 shader
     */
    constructor(gl: GLContex);
    private cubeVertexBuffer;
    private cubeElementBuffer;
    /**
     * 绘制半径
     */
    private r;
    /**
     * 绘制立方体
     */
    draw(camera: Camera, shader: BasicsShader): void;
}

declare class Planet implements Object3D {
    /**
     * GL 上下文
     */
    protected gl: GLContex;
    private vertexBuffer;
    private pointNum;
    static readonly NORMAL_COLOR: number[];
    /**
     * 加载
     */
    constructor(gl: GLContex);
    /**
     * 坐标
     */
    pos: [number, number, number];
    /**
     * 生成网格
     * @param r 半径
     * @param p 半径浮动
     * @param f 浮动频率
     * @param o 平滑程度
     * @param e 精度
     */
    genBuffer(r: number, p: number, f: number, o?: number, e?: number): number[];
    color: number[];
    draw(camera: Camera, shader: BasicsShader): void;
}

/**
 * 三阶贝塞尔曲线
 */
declare class Bezier3 {
    pointA: number[];
    pointB: number[];
    handA: number[];
    handB: number[];
    len: number;
    private tempVal;
    /**
     * 设置单一值
     */
    setSimpVal(a: number, b: number, c: number, d: number): void;
    /**
     * 获取贝塞尔插值
     * @param t
     * @returns
     */
    bezierM(t: number): any[];
}
/**
 * 平滑插值工具
 */
declare class SmoothTool {
    /**
     * 三阶贝塞尔插值
     * @param t 进度
     */
    static bezier3(t: number): number[];
    /**
     * 生成贝塞尔点集
     * @param val 一维稀疏数组
     * @param w 插值尾值
     * @param smooth 平滑程度
     * @param f 插值频率
     */
    static genSmoothLine(val: number[][], w?: boolean, smooth?: number, f?: number): number[];
    /**
     * 指定长度的区间内生成固定点
     * 随机距离随机摆动
     * @param len 覆盖程度
     * @param num 点数量
     * @param pow 摆动幅度
     */
    static genRandomPointR(len: number, num: number, pow: number): number[][];
    /**
     * 指定长度的区间内生成固定点
     * 固定距离随机摆动
     * @param len
     * @param num
     * @param pow
     */
    static genRandomPointM(len: number, num: number, pow: number): number[][];
    /**
     * 随机生成数字
     * @param min 最小值
     * @param max 最大值
     */
    static random(min: number, max: number): number;
}

export { BasicsShader, Bezier3, Camera, Clock, GLCanvas, GLCanvasOption, GLContex, GLProgram, GLRenderer, LoopFunction, Object3D, Planet, SmoothTool, TestAxis, TestBox };
