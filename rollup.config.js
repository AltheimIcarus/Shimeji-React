import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

import React from 'react';
import ReactDOM from 'react-dom';

export default [
    {
        input: './src/index.js',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
            },
            {
                file: 'dist/index.es.js',
                format: 'es',
                exports: 'named',
            }
        ],
        plugins: [
            image(),
            postcss({
                plugins: [],
                minimize: true,
            }),
            resolve(),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify('dev'),
            }),
            commonjs({
                include: ['node_modules/**'],
                requireReturnsDefault: 'auto',
            }),
            babel({
                presets: [
                    ['@babel/preset-react', { runtime: "automatic" }],
                ],
            }),
            external(),
            terser(),
        ]
    }
];