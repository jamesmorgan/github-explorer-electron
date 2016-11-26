var path = require('path');
var webpack = require('webpack');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

module.exports = {
	devtool: 'source-map',
	debug: true,

	entry: {
		'vendor': './browser-content/vendor',
		'app': './browser-content/main'
	},

	output: {
		path: __dirname + '/browser-content/build/',
		publicPath: 'browser-content/build/',
		filename: '[name].js',
		sourceMapFilename: '[name].js.map',
		chunkFilename: '[id].chunk.js'
	},

	resolve: {
		extensions: ['', '.ts', '.js', '.json', '.css', '.html']
	},

	module: {
		loaders: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				loader: 'ts'
			}
		]
	},

	plugins: [
		new CommonsChunkPlugin({name: 'vendor', filename: 'vendor.js', minChunks: Infinity}),
		new CommonsChunkPlugin({name: 'common', filename: 'common.js'})
	],
	target: 'node-webkit'
};
