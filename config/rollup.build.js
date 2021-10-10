import { terser } from 'rollup-plugin-terser';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import dts from "rollup-plugin-dts";

import {commonConfig, glsl, credit, externalList} from "./rollup.common";

const umdConfig = {

    ...commonConfig,

    // 插件
    plugins: [
        glsl(false),
        nodePolyfills(),
        nodeResolve(),
        typescript({target: "ES5"}),
        credit()
    ],

    // 输出
    output: {
        file: "./build/Rainbow.js",
        format: "umd",
        name: "Rainbow",

        sourcemap: true
    }

}

const umdMinConfig = {

    ...commonConfig,

    // 插件
    plugins: [
        glsl(true),
        nodePolyfills(),
        nodeResolve(),
        typescript({target: "ES5"}),
        terser(),
        credit()
    ],

    // 输出
    output: {
        file: "./build/Rainbow.min.js",
        format: "umd",
        name: "Rainbow",
    }

}

const moduleConfig = {

    ...commonConfig,

    // 插件
    plugins: [
        glsl(false),
        nodePolyfills(),
        nodeResolve(),
        typescript({target: "ES5"}),
        credit()
    ],

    // 输出
    output: {
        file: "./build/Rainbow.module.js",
        format: "esm",

        sourcemap: true
    }
}

const dtsConfig = {

    ...commonConfig,
    
    plugins: [dts()],

    output: { 
        file: "./build/Rainbow.module.d.ts",
        format: "es",
    },

    external: externalList.slice(0)
}

export default [
    umdConfig,
    moduleConfig,
    umdMinConfig,
    dtsConfig
]