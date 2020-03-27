import merge from 'webpack-merge'
import common from './webpack.common'

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules|dist)/,
        loader: 'eslint-loader',
        options: {
          fix: true
        }
      }
    ]
  },
  devtool: 'source-map'
})
