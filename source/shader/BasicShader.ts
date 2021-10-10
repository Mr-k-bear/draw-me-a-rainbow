import { mat4, vec3 } from "gl-matrix";
import { GLProgram } from "../core/GLProgram";

export { BasicsShader }

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
 class BasicsShader extends GLProgram{

    public override onload() {

        // 顶点着色
        const vertex = `
        attribute vec3 vPos;
        
        uniform vec3 r;
        uniform mat4 mvp;
        uniform vec3 pos;

        void main(){
            gl_Position = mvp * vec4(vPos * r + pos, 1.);
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
     * 传递半径数据
     */
    public r(r:number[]|vec3){
        this.gl.uniform3fv(
            this.uniformLocate("r"), r
        );
        return this;
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
}