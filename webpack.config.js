var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./webpack-helpers');

module.exports = {
	target: 'node-webkit',

	entry: {
		'polyfills': './browser-content/polyfills.ts',
		'vendor': './browser-content/vendor.ts',
		'app': './browser-content/main.ts'
	},

	output: {
		path: helpers.root('browser-content-build'),
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
				exclude: helpers.root('browser-content', 'app'),
				loaders: [ExtractTextPlugin.extract({fallbackLoader: "style-loader", loader: 'css-loader'}),
					'to-string-loader',
					'css-loader?sourceMap']
			},
			{
				test: /\.css$/,
				include: helpers.root('browser-content', 'app'),
				loader: 'raw'
			},
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
	]
};
