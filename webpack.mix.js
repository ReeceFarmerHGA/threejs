const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.webpackConfig({
        module: {
            rules: [{
                test: /\.jsx?$/,
                exclude: /('')/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'], // npm install --save-dev @babel/preset-env
                        // plugins: ['@babel/plugin-transform-arrow-functions']
                    }
                }]
            }]
        },
        node: {
            fs: 'empty'
        }
    }).js('resources/js/app.js', 'public/js')
    .js('resources/js/threejs.js', 'public/js')
    .sass('resources/sass/app.scss', 'public/css');
