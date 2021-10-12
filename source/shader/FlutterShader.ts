import { mat4, vec3 } from "gl-matrix";
import { GLProgram } from "../core/GLProgram";

export { FlutterShader }

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
 class FlutterShader extends GLProgram{

    public override onload() {

        // 顶点着色
        const vertex = `
        attribute vec3 vPos;
        
        uniform vec3 r;
        uniform mat4 mvp;
        uniform vec3 pos;
        uniform float t;

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
            vec3 sp = vPos + pos;
            sp.xy += noise(vPos.xy + t / 7.5) / 9.5;
            gl_Position = mvp * vec4(sp, 1.);
        }
        `;

        // 片段着色
        const fragment = `
        precision lowp float;
        
        uniform vec3 color;

        void main(){
            gl_FragColor = vec4(color, 1.);
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
        this.gl.uniform3fv(
            this.uniformLocate("color"), rgb
        );
    }

    public t(t:number) {

        this.gl.uniform1f(
            this.uniformLocate("t"), t
        );
    }
}