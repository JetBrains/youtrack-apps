const {join, resolve} = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ringUiWebpackConfig = require('@jetbrains/ring-ui/webpack.config');

const pkgConfig = require('./package.json').config;

const PATHS = {
  issuesList: {
    key: 'youtrack-issues-list',
    sources: join(__dirname, 'widgets/youtrack-issues-list'),
    outDir: 'widgets/youtrack-issues-list'
  },
  recentActivity: {
    key: 'youtrack-activities-widget',
    sources: join(__dirname, 'widgets/youtrack-activities-widget'),
    outDir: 'widgets/youtrack-activities-widget'
  }
};

const SOURCES = Object.values(PATHS).map(({sources}) => sources);

// Patch @jetbrains/ring-ui svg-sprite-loader config
ringUiWebpackConfig.loaders.svgInlineLoader.include.push(
  require('@jetbrains/logos'),
  require('@jetbrains/icons')
);

const webpackConfig = () => ({
  mode: 'development',
  entry: {
    [PATHS.issuesList.key]: `${PATHS.issuesList.sources}/app/app.js`,
    [PATHS.recentActivity.key]: `${PATHS.recentActivity.sources}/app/app.js`
  },
  output: {
    path: resolve(__dirname, pkgConfig.dist),
    filename: pathData => `widgets/${pathData.chunk.name}/[name].js`,
    chunkFilename: 'widgets/shared/[name].[chunkhash:4].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
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
          ...SOURCES
        ],
        loader: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.po$/,
        include: SOURCES,
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
    ...Object.values(PATHS).map(({sources, key, outDir}) => {
      const keys = Object.values(PATHS).map(path => path.key);

      return new HtmlWebpackPlugin({
        template: `${sources}/index.html`,
        excludeChunks: keys.filter(k => k !== key), // Exclude other entry point chunks!
        filename: `${outDir}/index.html`
      });
    }),
    new CopyWebpackPlugin([
      'manifest.json',
      'youtrack.svg',
      ...Object.values(PATHS).map(({sources, outDir}) => (
        {from: `${sources}/widget-settings.json`, to: outDir}
      ))
    ], {})
  ]
});

module.exports = webpackConfig;
