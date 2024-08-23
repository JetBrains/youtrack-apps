const {join, resolve} = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ringUiWebpackConfig = require('@jetbrains/ring-ui/webpack.config');

const pkgConfig = require('./package.json').config;

const componentsPath = join(__dirname, 'issues-list-widget/src');

// Patch @jetbrains/ring-ui svg-sprite-loader config
ringUiWebpackConfig.loaders.svgSpriteLoader.include.push(
  require('@jetbrains/logos'),
  require('@jetbrains/icons')
);


const webpackConfig = () => ({
  mode: 'development',
  entry: `${componentsPath}/app/app.js`,
  resolve: {
    mainFields: ['module', 'browser', 'main'],
    alias: {
      react: resolve('./node_modules/react'),
      'react-dom': resolve('./node_modules/react-dom'),
      '@jetbrains/ring-ui': resolve('./node_modules/@jetbrains/ring-ui')
    }
  },
  output: {
    path: resolve(__dirname, pkgConfig.dist),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  module: {
    rules: [
      ...ringUiWebpackConfig.config.module.rules,
      {
        test: /\.css$/,
        exclude: [ringUiWebpackConfig.componentsPath],
        use: ['style-loader', {
          loader: 'css-loader',
          options: {
            modules: {
              auto: true,
              localIdentName: '[local]_[hash:3]'
            }
          }
        }]
      },
      {
        test: /\.js$/,
        include: [
          join(__dirname, 'node_modules/chai-as-promised'),
          componentsPath
        ],
        loader: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.po$/,
        include: componentsPath,
        use: [
          'json-loader',
          {
            loader: 'angular-gettext-loader',
            options: {format: 'json'}
          }
        ]
      }
    ]
  },
  devServer: {
    hot: true,
    port: '9010',
    devMiddleware: {
      stats: 'minimal'
    },
    client: {
      overlay: {
        // https://github.com/webpack/webpack-dev-server/issues/4771
        runtimeErrors: false
      },
      logging: 'error'
    },
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'html-loader?interpolate!issues-list-widget/src/index.html'
    }),
    new CopyWebpackPlugin([
      'manifest.json'
    ], {})
  ]
});

module.exports = webpackConfig;
