import nodePolyfills from 'rollup-plugin-polyfill-node';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import dts from "rollup-plugin-dts";

import {commonConfig, credit, externalList} from "./rollup.common";

const moduleConfig = {

    ...commonConfig,

    // 插件
    plugins: [
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
    moduleConfig,
    dtsConfig
]