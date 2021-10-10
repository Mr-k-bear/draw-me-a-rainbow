export {Bezier3, SmoothTool}

/**
 * 三阶贝塞尔曲线
 */
class Bezier3 {
    
    public pointA:number[];
    public pointB:number[];

    public handA:number[];
    public handB:number[];

    public len:number = 0;

    private tempVal:number[];

    /**
     * 设置单一值
     */
    public setSimpVal(a:number, b:number, c:number, d:number){

        this.pointA.length = 0;
        this.pointB.length = 0;
        this.handA.length = 0;
        this.handB.length = 0;

        this.pointA.push(a);
        this.pointB.push(b);
        this.handA.push(c);
        this.handB.push(d);
    }

    /**
     * 获取贝塞尔插值
     * @param t 
     * @returns 
     */
    public bezierM(t:number){

        // 长度搜索
        if (this.len) this.len = Math.min(
            this.pointA.length,
            this.pointB.length,
            this.handA.length,
            this.handB.length
        );

        // 插值计算
        this.tempVal = SmoothTool.bezier3(t);

        // 生成插值
        let res = [];
        for (let i = 0; i < this.len; i++) {
            res[i] = 
            this.pointA[i] * this.tempVal[0] +
            this.handA[i] * this.tempVal[1] +
            this.handB[i] * this.tempVal[2] +
            this.pointB[i] * this.tempVal[3]
        }

        return res;
    }

}

/**
 * 平滑插值工具
 */
class SmoothTool {

    /**
     * 三阶贝塞尔插值
     * @param t 进度
     */
    static bezier3(t:number):number[] {
        return [
            (1 - t) ** 3,
            3 * t * (1 - t) ** 2,
            3 * t ** 2 * (1 - t),
            t ** 3
        ];
    }

    /**
     * 生成贝塞尔点集
     * @param val 一维稀疏数组
     * @param w 插值尾值
     * @param smooth 平滑程度
     * @param f 插值频率
     */
    static genSmoothLine(val:number[][], w:boolean = false, smooth:number = 1, f:number = 1) {

        let res:number[] = [];

        let bz = new Bezier3();

        for (let i = 0; i < val.length - 1; i++) {

            bz.pointA = val[i];
            bz.pointB = val[i + 1];
            
            bz.handA = [bz.pointA[0] + smooth, bz.pointA[1]];
            bz.handB = [bz.pointB[0] - smooth, bz.pointB[1]];

            bz.len = 2;

            // console.log(bz);

            // 计算插值次数
            const num = (bz.pointB[0] - bz.pointA[0]) / f;

            for(let j = 0; j < num; j++) {

                // console.log(num, j, j / num);

                res.push(bz.bezierM(j / num)[1]);
            }

        }

        if (w) res.push(val[val.length - 1][1]);

        return res;

    }

    /**
     * 指定长度的区间内生成固定点
     * 随机距离随机摆动
     * @param len 覆盖程度
     * @param num 点数量
     * @param pow 摆动幅度
     */
    static genRandomPointR(len:number,num:number,pow:number):number[][] {
        
        let res = [];

        for (let i = 0; i < num; i++) {
            res.push([
                Math.random(),
                (Math.random() - .5) * 2 * pow
            ]);
        }

        // 排序
        res = res.sort((a, b) => a[0] - b[0]);

        let min = res[0][0];
        let max = res[res.length - 1][0];
        let range = max - min;

        // 最小归一化
        for (let i = 0; i < res.length; i++) {
            res[i][0] = Math.floor((res[i][0] - min) * len / range);
        }

        return res;
    }

    /**
     * 指定长度的区间内生成固定点
     * 固定距离随机摆动
     * @param len 
     * @param num 
     * @param pow 
     */
    static genRandomPointM(len:number,num:number,pow:number):number[][] {

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
     * 随机生成数字
     * @param min 最小值
     * @param max 最大值
     */
    static random(min:number, max:number):number {
        return Math.random() * (max - min) + min;
    }
}