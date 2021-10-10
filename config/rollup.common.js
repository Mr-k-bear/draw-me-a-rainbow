
export const externalList = [
    "events", 
    "@juggle/resize-observer"
];

// 版权声明
export const CREDIT = `
/**
 * @license
 * Copyright 2021-08-02 MrKBear mrkbear@qq.com
 * All rights reserved.
 * This file is part of the App project.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
`;

// 添加 credit 信息
export const credit = () => ({
    renderChunk: (code) => ({
        code: CREDIT + code,
        map: null
    })
})

export const glslTerser = (code) => 
code.replace( /\/\* ?glsl ?\*\/ ?\`((.|\r|\n)*)\`/, ( m, p ) => JSON.stringify(
        p
        .trim()
        .replace( /\r/g, '' )
        .replace( /[ \t]*\/\/.*\n/g, '' ) // 删除 //
        .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // 删除 /* */
        .replace( /\n{2,}/g, '\n' ) // # \n+ to \n
    )
);

export const glsl = (min = true) => ({

    transform(code, id){
        if ( /.+\.(vert|frag)\.(js|ts)$/.test( id ) === false ) return;
        return {
            code: min ? glslTerser(code) : code,
            map: null
        };
    }

});

// babel 默认配置文件
export const babelRc = {
    presets: [
        ['@babel/preset-env', {modules: false}]
    ]
};

export const commonConfig = {

    // 入口文件
    input: "./source/Rainbow.ts",
    
    // 外部链接
    external: [],
};