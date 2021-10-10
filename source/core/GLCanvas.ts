import { EventEmitter } from "events";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';

export { GLCanvas, GLCanvasOption};

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
    eventLog?: boolean
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
class GLCanvas extends EventEmitter {

    /**
     * HTML节点
     */
    private readonly canvas:HTMLCanvasElement;
    private readonly div:HTMLDivElement;

    /**
     * 获取节点
     */
    public get dom(){
        return this.div;
    }

    public get can(){
        return this.canvas;
    }

    /**
     * 像素分辨率
     */
    public pixelRatio:number = devicePixelRatio ?? 1;

    /**
     * 帧缓冲区宽度
     */
    public get width():number {
        return this.canvas.width
    }

    /**
     * 帧缓冲区高度
     */
    public get height():number {
        return this.canvas.height
    }

    /**
     * 画布宽度
     */
    public get offsetWidth():number {
        return this.canvas.offsetWidth
    }

    /**
     * 画布高度
     */
    public get offsetHeight():number {
        return this.canvas.offsetHeight
    }

    /**
     * 缩放 X
     */
    public get scaleX():number {
        return this.canvas.width / this.canvas.offsetWidth
    }

    /**
     * 缩放 Y
     */
    public get scaleY():number {
        return this.canvas.height / this.canvas.offsetHeight
    }
    
    /**
     * 分辨率 (画布宽高比)
     */
    public get ratio():number {
        return this.canvas.offsetWidth / this.canvas.offsetHeight;
    }

    /**
     * 缓存判断是否要设置 canvas 大小
     */
    private readonly offsetFlg:[number,number] = [NaN, NaN];

    /**
     * 画布大小适应到 css 大小
     */
    public resize(){

        if (
            this.offsetWidth !== this.offsetFlg[0] || 
            this.offsetHeight !== this.offsetFlg[1]
        ) {

            // 缓存记录
            this.offsetFlg[0] = this.offsetWidth;
            this.offsetFlg[1] = this.offsetHeight;

            // 重置缓冲区
            this.canvas.width = this.offsetWidth * this.pixelRatio;
            this.canvas.height = this.offsetHeight * this.pixelRatio;

            this.emit("resize", this);
        }

    }

    /**
     * 鼠标 X 坐标
     */
    public mouseX:number = 0;

    /**
     * 鼠标 Y 坐标
     */
    public mouseY:number = 0;
 
    /**
     * 鼠标相对 X 坐标
     */
    public mouseUvX:number = 0;
 
    /**
     * 鼠标相对 Y 坐标
     */
    public mouseUvY:number = 0;
 
    /**
     * 鼠标 GLX 坐标
     */
    public mouseGlX:number = 0;
 
    /**
     * 鼠标 GLY 坐标
     */
    public mouseGlY:number = 0;
 
    /**
     * 鼠标 X 变化量
     */
    public mouseMotionX:number = 0;
 
    /**
     * 鼠标 Y 变化量
     */
    public mouseMotionY:number = 0;

    /**
     * 缓存鼠标位置
     */
    private readonly mouseFlg:[number, number] = [NaN, NaN];

    /**
     * 保存鼠标数据
     */
    private calcMouseData(offsetX:number, offsetY:number):boolean {

        if (
            offsetX !== this.mouseFlg[0] || 
            offsetY !== this.mouseFlg[1]
        ){
            this.mouseX = offsetX;
            this.mouseY = offsetY;

            this.mouseUvX = offsetX / this.offsetWidth;
            this.mouseUvY = offsetY / this.offsetHeight;
            
            this.mouseGlX = this.mouseUvX * 2 - 1;
            this.mouseGlY = - this.mouseUvY * 2 + 1;
            
            this.mouseMotionX = offsetX - this.mouseFlg[0];
            this.mouseMotionY = offsetY - this.mouseFlg[1];

            this.mouseFlg[0] = offsetX;
            this.mouseFlg[1] = offsetY;
            
            return true;
        }

        return false;
    }

    private calcMouseDataFromTouchEvent(e:TouchEvent){

        if (e.touches.length <= 0) return;

        let offsetX = e.touches[0].clientX - this.canvas.offsetLeft;
        let offsetY = e.touches[0].clientY - this.canvas.offsetTop;

        return this.calcMouseData(offsetX, offsetY);
    }

    /**
     * 鼠标触摸触发计数
     */
    private touchCount:number = 0;

    /**
     * 鼠标是否按下
     */
    public mouseDown:boolean = false;

    /**
     * 检测 canvas 变化
     */
    private readonly obs:ResizeObserver = null;

    /**
     * 使用 canvas 节点创建
     * 不适用节点则自动创建
     * @param ele 使用的 canvas节点
     * @param o 设置
     */
    public constructor(ele?:HTMLCanvasElement, o?:GLCanvasOption){

        super();

        let opt = o ?? {};

        let autoResize = opt.autoResize ?? true;
        let mouseEvent = opt.mouseEvent ?? true;
        let eventLog = opt.eventLog ?? false;


        // 获取/创建节点
        this.canvas = ele ?? document.createElement("canvas");
        
        this.div = document.createElement("div");
        this.div.appendChild(this.canvas);

        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";

        if (autoResize){

            // 创建观察者
            this.obs = new (window.ResizeObserver || Polyfill)
            ((entries:ResizeObserverEntry[])=>{

                for (let entry of entries) {
                    if(entry.target === this.canvas) this.resize();
                }

            });

            // 大小监听
            this.obs.observe(this.canvas);

        }

        if (mouseEvent) {

            this.canvas.addEventListener("mouseup",(e)=>{

                if(this.touchCount >= 2) {
                    this.touchCount = 0;
                    return;
                }

                if (eventLog) console.log("GLCanvas: mouseup");

                this.mouseDown = false;
                this.calcMouseData(e.offsetX, e.offsetY);
                this.emit("mouseup", this);

            });

            this.canvas.addEventListener("touchstart",(e)=>{

                this.touchCount = 1;

                if (eventLog) console.log("GLCanvas: touchstart");

                this.mouseDown = true;
                this.calcMouseDataFromTouchEvent(e);
                this.emit("mousedown", this);

            });

            this.canvas.addEventListener("mousedown",(e)=>{

                if(this.touchCount >= 2) return;

                if (eventLog) console.log("GLCanvas: mousedown");

                this.mouseDown = true;
                this.calcMouseData(e.offsetX, e.offsetY);
                this.emit("mousedown", this);

            });

            this.canvas.addEventListener("touchend",(e)=>{
                
                this.touchCount ++;

                if (eventLog) console.log("GLCanvas: touchend");

                this.mouseDown = false;
                this.calcMouseDataFromTouchEvent(e);
                this.emit("mouseup", this);

            });

            this.canvas.addEventListener("mousemove",(e)=>{

                if(this.touchCount >= 2) return;

                if (eventLog) console.log("GLCanvas: mousemove");

                if (this.calcMouseData(e.offsetX, e.offsetY)) this.emit("mousemove", this);

            });

            this.canvas.addEventListener("touchmove",(e)=>{

                if (eventLog) console.log("GLCanvas: touchmove");

                if (this.calcMouseDataFromTouchEvent(e)) this.emit("mousemove", this);

            });

        }
        
    }

}