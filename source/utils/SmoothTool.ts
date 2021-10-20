export {Bezier3Point}

/**
 * 带有插值手柄的点
 */
class Bezier3Point {

    /**
     * 点位置
     */
    public point:number[];

    /**
     * 手柄 A
     */
    public handA:number[];

    /**
     * 手柄 B
     */
    public handB:number[];

    /**
     * 数据维度
     */
    private _len:number;
    public get len():number {

        // 存在维度限制
        if (this._len !== undefined) return this._len;

        // 计算最小维度
        return Math.min(
            this.point.length, 
            this.handA.length,
            this.handB.length
        );
    }

    /**
     * 用于曲线生成
     */
    public time:number;

    /**
     * 设置数据维度个数
     * @param len 维度个数
     */
    public setLen(len:number) {
        this._len = len;
        return this;
    }

    /**
     * 设置时间
     * @param time 时间
     */
    public setTime(time:number) {
        this.time = time;
        return this;
    }

    /**
     * 构造函数
     * @param point 数据点
     * @param handA 手柄A
     * @param handB 手柄B
     */
    public constructor(point:number[], handA:number[] = [], handB:number[] = []){
        this.point = point.slice(0);
        this.handA = handA.slice(0);
        this.handB = handB.slice(0);
    }

    /**
     * 克隆一个新的点
     */
    public clone(){

        return new Bezier3Point(
            this.point,
            this.handA,
            this.handB
        )
        
        .setTime(this.time)
        .setLen(this.len)
    }

    /**
     * 生成一对重合手柄
     */
    public genNoneHand() {
        this.handA = this.point.slice(0);
        this.handB = this.point.slice(0);
        return this;
    }

    /**
     * 按照维度生成平滑手柄
     * @param s 平滑等级
     * @param b 分离平滑
     * @param d 使用维度
     */
    public genFlatHand(d:number = 0, s:number = 1, b:number = s) {

        // 复制手柄
        this.genFlatHand();

        // 平滑移动
        this.handA[d] -= s;
        this.handB[d] += b;

        return this;
    }

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
    public genSideHand(x:number, y:number, s:number = 1, b:number = s) {

        // 计算长度
        let len = (x ** 2 + y ** 2) ** .5;

        // 归一化
        let nx = x / len;
        let ny = y / len;

        // 旋转向量
        let rx = nx * 0 - ny * 1;
        let ry = ny * 0 + nx * 1;

        // 设置手柄 A
        this.handA[0] = this.point[0] + rx * s;
        this.handA[1] = this.point[1] + ry * b;

        // 设置手柄 B
        this.handB[0] = this.point[0] - rx * s;
        this.handB[1] = this.point[1] - ry * b;

        return this;
    }

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
    public genDirHand(x:number, y:number, s:number = 1, b:number = s) {

        // 计算长度
        let len = (x ** 2 + y ** 2) ** .5;

        // 归一化
        let nx = x / len;
        let ny = y / len;

        // 设置手柄 A
        this.handA[0] = this.point[0] - nx * s;
        this.handA[1] = this.point[1] - ny * b;

        // 设置手柄 B
        this.handB[0] = this.point[0] + nx * s;
        this.handB[1] = this.point[1] + ny * b;

        return this;
    }

    /**
     * 获取于另一个点之间的插值
     * @param p 下一个点
     * @param t 插值进度
     */
    public bezier3(p:Bezier3Point, t:number):number[] {

        // 生成插值
        let res = [];
        for (let i = 0; i < this.len; i++) {

            // 贝塞尔插值
            res[i] = 
            this.point[i] * (1 - t) ** 3 +
            this.handB[i] * 3 * t * (1 - t) ** 2 +
            p.handA[i]    * 3 * t ** 2 * (1 - t) +
            p.point[i]    * t ** 3
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

    /**
     * 获取两个点之间的 bezier3 插值
     * @param p1 第一个 bezier 点
     * @param p2 第二个 bezier 点
     * @param t 插值进度
     */
    public static bezier3(p1:Bezier3Point, p2:Bezier3Point, t:number):number[] {
        return p1.bezier3(p2, t);
    }

    /**
     * 贝塞尔数据转顶点数据
     * 这个函数通常用来测试
     * @param b 贝塞尔点集
     * @param d 维度拓展
     */
    public static bezierPoint2Vertex(b:Bezier3Point[], d:boolean = true):number[] {

        let res:number[] = [];

        for (let i = 0; i < b.length; i++) {

            // hand B
            for (let j = 0; j < b[i].handA.length; j++) 
            res.push(b[i].handB[j]);

            if (d) res.push(0);

            // point
            for (let j = 0; j < b[i].handA.length; j++) 
            res.push(b[i].point[j]);

            if (d) res.push(0);
            
            // handA
            for (let j = 0; j < b[i].handA.length; j++) 
            res.push(b[i].handA[j]);

            if (d) res.push(0);
        }

        return res;
    }

    /**
     * 处理圆形顶点数据
     * @param data 数据
     * @param c 圆心
     */
    public static processCircularData(data:number[], ...c:number[]):number[] {

        // 封闭圆
        data.push(data[0]);
        data.push(data[1]);
        data.push(data[2]);

        // console.log(data[0], data[1], data[2]);

        // 设置圆心
        data.unshift(c[2] ?? 0);
        data.unshift(c[1] ?? 0);
        data.unshift(c[0] ?? 0);
        
        // console.log(data);

        return data;
    }

    /**
     * 根据时间间隔 t 来生成一条平滑的曲线
     * @param points 采样点
     * @param f 插值频率
     * @param w 是否加入末尾的点
     * @param d 维度拓展
     */
    public static genSmoothLine(
        points:Bezier3Point[], f:number = 1, w:boolean = false, d:boolean = true
    ):number[] {
        
        // 对默认点集进行排序
        points = points.sort((a, b) => a.time - b.time);

        // 开始插值
        let res:number[] = [];

        for(let i = 0; i < points.length - 1; i++) {

            // 获取插值点
            let pa = points[i];
            let pb = points[i + 1];

            // 计算插值次数
            const num = (pb.time - pa.time) / f;

            for(let j = 0; j < num; j++) {
                res = res.concat(pa.bezier3(pb, j / num));
                if (d) res.push(0);
            }
        }

        if (w) res = res.concat(points[points.length - 1].point);
        if (d && w) res.push(0);

        return res;
    }

    /**
     * 生成一个等距随机摆动圆环
     * @param r 半径
     * @param p 幅度
     * @param n 数量
     * @param s 平滑
     * @param e 精度
     */
    public static genIsometricCircle(
        r:number, p:number, n:number, s:number, e:number = Math.PI / 60
    ):Bezier3Point[] {

        // 中共点个数
        let num = Math.PI * 2 / e;

        let res:Bezier3Point[] = [];
        for(let i = 0; i < n; i++) {

            // 进度
            let pro = i / n;
            let rl = (Math.random() - .5) * 2 * p;

            let pm = [
                Math.cos(- pro * Math.PI * 2) * (r + rl),
                Math.sin(- pro * Math.PI * 2) * (r + rl)
            ];

            // 向量旋转
            let h = new Bezier3Point(pm)

            // 设置长度
            .setLen(2)
            
            // 计算时间向量
            .setTime(pro * num)

            // 生成向心手柄
            .genSideHand(pm[0], pm[1], s);

            // console.log(pm)

            res.push(h);
        }

        // 闭合圆形
        res.push(res[0].clone().setTime(num));

        return res;
    }

    /**
     * 生成一个等距周期摆动圆环
     * @param r 半径
     * @param p 幅度
     * @param n 数量
     * @param s 平滑
     * @param e 精度
     */
    public static genCycleIsometricCircle(
        r:number, p:number, n:number, s:number, e:number = Math.PI / 60
    ):Bezier3Point[] {

        // 中共点个数
        let num = Math.PI * 2 / e;

        let res:Bezier3Point[] = [];
        for(let i = 0; i < n; i++) {

            // 进度
            let pro = i / n;
            let rl = (i % 2 === 0 ? 1 : -1) * r * .3 +
            (Math.random() - .5) * 2 * p * (i % 2 === 0 ? 1 : .1);

            let pm = [
                Math.cos(- pro * Math.PI * 2) * (r + rl),
                Math.sin(- pro * Math.PI * 2) * (r + rl)
            ];

            // 向量旋转
            let h = new Bezier3Point(pm)

            // 设置长度
            .setLen(2)
            
            // 计算时间向量
            .setTime(pro * num)

            // 生成向心手柄
            .genSideHand(pm[0], pm[1], s * (i % 2 === 0 ? 1 : 0.5));

            // console.log(pm)

            res.push(h);
        }

        // 闭合圆形
        res.push(res[0].clone().setTime(num));

        return res;

    }

    /**
     * 生成角度范围的随机摆线
     * @param r 随机半径
     * @param n 生成数量
     * @param l 数据长度
     * @param s 平滑系数
     */
    public static genRangeSwing(
        r:number, n:number, l:number, s:number
    ):Bezier3Point[] {
        let res:Bezier3Point[] = [];
        for (let i = 0; i < n; i++) {

            // 随机的角度
            let rd = - Math.random() * Math.PI * 2;

            // 随机长度
            let rl = Math.random() * r;

            // 生成随机的点
            let pm = [
                Math.cos(rd) * rl,
                Math.sin(rd) * rl
            ];

            // 向量旋转
            let h = new Bezier3Point(pm)

            // 设置长度
            .setLen(2);

            res.push(h);
        }

        let allLen = 0;

        // 设置第一个值
        res[0].setTime(0);

        // 计算总长度
        for (let i = 1; i < res.length; i++) {

            // 获取相邻的两个点
            let p1 = res[i - 1];
            let p2 = res[i];

            // 计算长度
            let l = (
                (p1.point[0] - p2.point[0])**2 + 
                (p1.point[1] - p2.point[1])**2
            )**.5;

            allLen += l;

            // 保存长度
            p2.setTime(allLen);
        }

        res[0].genNoneHand();
        res[res.length - 1].genNoneHand();
        res[res.length - 1].setTime(l);

        // 设置手柄 & 归一化时间
        for (let i = 1; i < (res.length - 1); i++) {

            // 获取三个相邻的点
            let p1 = res[i - 1];
            let p2 = res[i];
            let p3 = res[i + 1];

            // 时间归一化
            p2.setTime(p2.time * l / allLen);

            // 平滑手柄
            p2.genDirHand(
                p1.point[0] - p3.point[0],
                p1.point[1] - p3.point[1],
                s
            );
        }

        return res;
    }

}