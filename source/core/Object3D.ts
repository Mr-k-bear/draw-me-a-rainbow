import {GLContex} from "./GLType";
export {Object3D}

/**
 * 3D物体
 */
interface Object3D {

    /**
     * 绘制方法
     */
    draw(...d:any):void;

}