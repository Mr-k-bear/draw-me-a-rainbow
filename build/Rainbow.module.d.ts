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

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
declare class FlutterShader extends GLProgram {
    onload(): void;
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
    t(t: number): void;
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
    private time;
    color: number[];
    update(t: number): void;
    draw(camera: Camera, shader: FlutterShader): void;
}

declare class Start implements Object3D {
    /**
     * GL 上下文
     */
    protected gl: GLContex;
    private vertexBuffer;
    private pointNum;
    static readonly NORMAL_COLOR: number[][];
    /**
     * 加载
     */
    constructor(gl: GLContex);
    /**
     * 坐标
     */
    pos: [number, number, number];
    private time;
    color: number[];
    update(t: number): void;
    draw(camera: Camera, shader: FlutterShader): void;
}

declare class Rainbow implements Object3D {
    /**
     * GL 上下文
     */
    protected gl: GLContex;
    static readonly NORMAL_COLOR: number[][];
    /**
     * 主要路径
     */
    private pathMain;
    /**
     * 多边形顶点数据
     */
    private vertexArray;
    private vertexBuffer;
    private pointNum;
    /**
     * 最大缓冲区大小
     */
    maxVertexNum: number;
    /**
     * 最小限制角度
     */
    minAngle: number;
    /**
     * 上次的向量
     */
    private lastVector;
    /**
     * 使用向量延长路径
     */
    extendVector(x: number, y: number): void;
    /**
     * 上传数据到 gl
     * @param arr 数据数组
     */
    private updateVertexDate;
    /**
     * 生成角度范围的随机摆线
     */
    genRangeSwing(): void;
    /**
     * 初始化顶点
     */
    constructor(gl: GLContex);
    /**
     * 坐标
     */
    pos: [number, number, number];
    private time;
    color: number[];
    update(t: number): void;
    draw(camera: Camera, shader: FlutterShader): void;
}

/**
 * 带有插值手柄的点
 */
declare class Bezier3Point {
    /**
     * 点位置
     */
    point: number[];
    /**
     * 手柄 A
     */
    handA: number[];
    /**
     * 手柄 B
     */
    handB: number[];
    /**
     * 数据维度
     */
    private _len;
    get len(): number;
    /**
     * 用于曲线生成
     */
    time: number;
    /**
     * 设置数据维度个数
     * @param len 维度个数
     */
    setLen(len: number): this;
    /**
     * 设置时间
     * @param time 时间
     */
    setTime(time: number): this;
    /**
     * 构造函数
     * @param point 数据点
     * @param handA 手柄A
     * @param handB 手柄B
     */
    constructor(point: number[], handA?: number[], handB?: number[]);
    /**
     * 克隆一个新的点
     */
    clone(): Bezier3Point;
    /**
     * 生成一对重合手柄
     */
    genNoneHand(): this;
    /**
     * 按照维度生成平滑手柄
     * @param s 平滑等级
     * @param b 分离平滑
     * @param d 使用维度
     */
    genFlatHand(d?: number, s?: number, b?: number): this;
    /**
     * 生成垂直于向量的手柄
     *      |
     * A <--|--> B
     *      |
     * @param x X 分量
     * @param y Y 分量
     * @param s 平滑程度
     * @param b 分离平滑
     */
    genSideHand(x: number, y: number, s?: number, b?: number): this;
    /**
     * 生成方向向量的手柄
     *
     * A <-- ----> --> B
     *
     * @param x X 分量
     * @param y Y 分量
     * @param s 平滑程度
     * @param b 分离平滑
     */
    genDirHand(x: number, y: number, s?: number, b?: number): this;
    /**
     * 获取于另一个点之间的插值
     * @param p 下一个点
     * @param t 插值进度
     */
    bezier3(p: Bezier3Point, t: number): number[];
    /**
     * 随机生成数字
     * @param min 最小值
     * @param max 最大值
     */
    static random(min: number, max: number): number;
    /**
     * 获取两个点之间的 bezier3 插值
     * @param p1 第一个 bezier 点
     * @param p2 第二个 bezier 点
     * @param t 插值进度
     */
    static bezier3(p1: Bezier3Point, p2: Bezier3Point, t: number): number[];
    /**
     * 贝塞尔数据转顶点数据
     * 这个函数通常用来测试
     * @param b 贝塞尔点集
     * @param d 维度拓展
     */
    static bezierPoint2Vertex(b: Bezier3Point[], d?: boolean): number[];
    /**
     * 处理圆形顶点数据
     * @param data 数据
     * @param c 圆心
     */
    static processCircularData(data: number[], ...c: number[]): number[];
    /**
     * 根据时间间隔 t 来生成一条平滑的曲线
     * @param points 采样点
     * @param f 插值频率
     * @param w 是否加入末尾的点
     * @param d 维度拓展
     */
    static genSmoothLine(points: Bezier3Point[], f?: number, w?: boolean, d?: boolean): number[];
    /**
     * 生成一个等距随机摆动圆环
     * @param r 半径
     * @param p 幅度
     * @param n 数量
     * @param s 平滑
     * @param e 精度
     */
    static genIsometricCircle(r: number, p: number, n: number, s: number, e?: number): Bezier3Point[];
    /**
     * 生成一个等距周期摆动圆环
     * @param r 半径
     * @param p 幅度
     * @param n 数量
     * @param s 平滑
     * @param e 精度
     */
    static genCycleIsometricCircle(r: number, p: number, n: number, s: number, e?: number): Bezier3Point[];
}

export { BasicsShader, Bezier3Point, Camera, Clock, FlutterShader, GLCanvas, GLCanvasOption, GLContex, GLProgram, GLRenderer, LoopFunction, Object3D, Planet, Rainbow, Start, TestAxis, TestBox };
