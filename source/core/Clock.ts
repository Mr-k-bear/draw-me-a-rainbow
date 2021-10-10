import { Stats } from "stats.js";

export {Clock, LoopFunction};

type LoopFunction = (t:number)=>void;

/**
 * 时钟
 */
class Clock {

    /**
     * 总用时
     */
    private allTime:number = 0;

    /**
     * 速率
     */
    public speed:number = 1;

    /**
     * fps监视器
     */
    private stats:Stats;

    /**
     * 是否使用 Stats
     */
    private isStatsOn:boolean = false;

    /**
     * 开启 fps 监视
     */
    public useStats():this {
        
        this.stats = new Stats();

        this.isStatsOn = true;
        this.stats.showPanel(0);

        document.body.appendChild(this.stats.dom);
        return this;
    }

    /**
     * 主函数
     */
    private fn:LoopFunction;

    /**
     * 动画循环
     * @param fn 循环函数
     */
    public constructor(fn?:LoopFunction){

        this.fn = fn ?? ((t)=>{});

    }

    /**
     * 设置函数
     * @param fn 循环函数
     */
    public setFn(fn:LoopFunction){

        this.fn = fn;

    }

    /**
     * 开始
     */
    public run(){

        // 主循环
        let loop = (t:number)=>{

            if (this.isStatsOn) this.stats.begin();

            // 时差
            let dur = (t - this.allTime) * this.speed / 1000;

            // 检测由于失焦导致的丢帧
            if (t - this.allTime < 100) {
                this.fn(dur);
            }

            // 更新时间
            this.allTime = t;

            if (this.isStatsOn) this.stats.end();

            // 继续循环
            requestAnimationFrame(loop);

        }

        // 获取时间
        requestAnimationFrame((t)=>{

            // 记录初始时间
            this.allTime = t;

            // 开启循环
            requestAnimationFrame(loop);
        })
    }
}