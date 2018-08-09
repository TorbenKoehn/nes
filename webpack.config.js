
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {resolve} = require('path');
const webpack = require('webpack');

module.exports = {
    output: {
        path: resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[id].js',
        sourceMapFilename: '[name].js.map',
        library: 'Nes'
    },
    target: 'web',
    entry: {
        nes: ['babel-polyfill', resolve(__dirname, 'src', 'index.ts')]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        })
    ],
    mode: process.env.APP_ENV || 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.jsx?/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.tsx?/,
                use: ['babel-loader', 'ts-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    // fallback to style-loader in development
                    process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    }
};