var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./webpack-helpers');

module.exports = {
	entry: {
		'polyfills': './browser-content/polyfills.ts',
		'vendor': './browser-content/vendor.ts',
		'app': './browser-content/main.ts'
	},

	output: {
		path: helpers.root('browser-content-build'),
		// publicPath: '',
		// publicPath: 'browser-content-build/',
		filename: '[name].js',
		sourceMapFilename: '[name].js.map',
		chunkFilename: '[id].chunk.js'
	},

	htmlLoader: {
		minimize: false // workaround for ng2
	},

	resolve: {
		extensions: ['', '.ts', '.js']
	},

	module: {
		loaders: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				loaders: ['awesome-typescript-loader', 'angular2-template-loader']
			},
			{
				test: /\.html$/,
				loader: 'html'
			},
			{
				test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
				loader: 'file?name=assets/[name].[hash].[ext]'
			},
			{
				test: /\.css$/,
				// exclude: ['/browser-content/app/', /dist/],
				exclude: helpers.root('browser-content', 'app'),
				loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
			},
			{
				test: /\.css$/,
				// include: ['/browser-content/app/'],
				include: helpers.root('browser-content', 'app'),
				loader: 'raw'
			}
		]
	},

	plugins: [
		new webpack.optimize.CommonsChunkPlugin({
			name: ['app', 'vendor', 'polyfills']
		}),

		new HtmlWebpackPlugin({
			template: 'browser-content/index.html'
		}),

		new ExtractTextPlugin('[name].css')

	],

	target: 'node-webkit'
};

// var path = require('path');
// var webpack = require('webpack');
// var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
//
// module.exports = {
// 	devtool: 'inline-source-map',
// 	// devtool: 'source-map',
// 	debug: true,
//
// 	entry: {
// 		'vendor': './browser-content/vendor',
// 		'app': './browser-content/main'
// 	},
//
// 	output: {
// 		path: __dirname + '/browser-content-build/',
// 		publicPath: 'browser-content-build/',
// 		filename: '[name].js',
// 		sourceMapFilename: '[name].js.map',
// 		chunkFilename: '[id].chunk.js'
// 	},
//
// 	resolve: {
// 		// The empty string is needed for pulling in Node modules which do not need to provide an extension
// 		extensions: ['', '.ts', '.js', '.json', '.css', '.html']
// 	},
//
// 	module: {
// 		loaders: [
// 			// {
// 			// 	test: /\.ts$/,
// 			// 	exclude: [/node_modules/],
// 			// 	loader: 'ts',
// 			// },
// 			{
// 				test: /\.ts$/,
// 				loaders: 'ts'
// 			},
// 			{
// 				test: /\.css$/,
// 				loaders: 'style!css'
// 			}
// 		]
// 	},
//
// 	plugins: [
// 		new CommonsChunkPlugin({name: 'vendor', filename: 'vendor.js', minChunks: Infinity}),
// 		new CommonsChunkPlugin({name: 'common', filename: 'common.js'})
// 	],
// 	target: 'node-webkit'
// };
