const path = require('path');

module.exports = {
    mode: 'production',
    target: 'node',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "crypto": require.resolve('crypto-browserify'),
            "http": require.resolve("stream-http"),
            "url": require.resolve("url/"),
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
            "vm": require.resolve("vm-browserify")
        } 
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};