import { mat4, vec3 } from "gl-matrix";
import { GLProgram } from "../core/GLProgram";

export { RainbowShader }

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
 class RainbowShader extends GLProgram{

    public override onload() {

        // 顶点着色
        const vertex = `
        attribute vec3 vPos;
        attribute vec3 vDir;
        attribute float vTime;
        attribute float vIdx;
        
        uniform float r;
        uniform mat4 mvp;
        uniform vec3 pos;

        uniform float t;
        uniform float tStart;
        uniform float tEnd;

        varying float idx;

        vec2 random2(vec2 st){
            st = vec2( dot(st,vec2(127.1,311.7)),
                      dot(st,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(st)*43758.5453123);
        }
        
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
        
            vec2 u = f*f*(3.0-2.0*f);
        
            return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                             dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                        mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                             dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        }

        void main(){

            const float processTh = .9;
            const float processBf = .35;

            float proClamp = 
            pow(clamp((tEnd - vTime) * processTh, 0., 1.), processBf) * 
            pow(clamp((vTime - tStart) * processTh, 0., 1.), processBf) ;

            proClamp += clamp(noise(vec2(vTime * .8)), 0., 1.) * proClamp;

            vec3 sp = vPos + pos + vDir * r * proClamp;
            sp.xy += noise(vPos.xy + t / 7.5) / 9.5;
            gl_Position = mvp * vec4(sp, 1.);
            idx = vIdx;
        }
        `;

        // 片段着色
        const fragment = `
        precision lowp float;
        
        uniform ivec2 color;

        varying float idx;

        const vec3 colorList0 = vec3(253. / 255., 180. / 255., 197. / 255.);
        const vec3 colorList1 = vec3(255. / 255., 204. / 255., 167. / 255.);
        const vec3 colorList2 = vec3(255. / 255., 236. / 255., 181. / 255.);
        const vec3 colorList3 = vec3(141. / 255., 247. / 255., 176. / 255.);
        const vec3 colorList4 = vec3(135. / 255., 187. / 255., 252. / 255.);
        const vec3 colorList5 = vec3(208. / 255., 192. / 255., 243. / 255.);

        vec3 colorList(int i){
            if (i == 0) return colorList0;
            else if (i == 1) return colorList1;
            else if (i == 2) return colorList2;
            else if (i == 3) return colorList3;
            else if (i == 4) return colorList4;
            else if (i == 5) return colorList5;
            else return colorList5;
        }

        void main(){

            float range = float(color[1] - color[0]);
            float md = float(color[0]) + idx * range;
            int index = int(floor(md));

            vec3 col = colorList(index);

            if (index != color[0]) {
                col = mix(col, colorList(index - 1), pow(fract(1. - md), 20.));
            }

            gl_FragColor = vec4(col, 1.);
        }
        `;

        // 保存代码
        this.setSource(vertex, fragment);

        // 编译
        this.compile();
    }

    /**
     * 坐标
     */
    public pos(r:number[]|vec3){
        this.gl.uniform3fv(
            this.uniformLocate("pos"), r
        );
        return this;
    }

    /**
     * 传递半径数据
     */
    public mvp(mat:mat4, transpose:boolean = false){
        this.gl.uniformMatrix4fv(
            this.uniformLocate("mvp"), transpose, mat
        );
        return this;
    }

    /**
     * 传递半径数据
     * @param {vec3|Number[]} rgb
     */
    public color(rgb:number[]|vec3){
        this.gl.uniform2iv(
            this.uniformLocate("color"), rgb
        );
    }

    /**
     * 时间
     * @param t 时间
     */
    public t(t:number) {

        this.gl.uniform1f(
            this.uniformLocate("t"), t
        );
    }

    /**
     * 时间
     * @param t 时间
     */
    public tStart(t:number) {

        this.gl.uniform1f(
            this.uniformLocate("tStart"), t
        );
    }

    /**
     * 时间
     * @param t 时间
     */
    public tEnd(t:number) {

        this.gl.uniform1f(
            this.uniformLocate("tEnd"), t
        );
    }

    /**
     * 时间
     * @param r 时间
     */
    public r(r:number) {

        this.gl.uniform1f(
            this.uniformLocate("r"), r
        );
    }
}