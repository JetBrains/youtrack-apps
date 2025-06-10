const {join, resolve} = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ringUiWebpackConfig = require('@jetbrains/ring-ui/webpack.config');

const pkgConfig = require('./package.json').config;

const PATHS = {
  projectTeam: {
    key: 'hub-project-team-widget',
    sources: join(__dirname, 'widgets/hub-project-team-widget'),
    outDir: 'widgets/hub-project-team-widget'
  },
  revokeAccess: {
    key: 'revoke-user-access',
    sources: join(__dirname, 'widgets/revoke-user-access'),
    outDir: 'widgets/revoke-user-access'
  }
};

const SOURCES = Object.values(PATHS).map(({sources}) => sources);

const webpackConfig = () => ({
  mode: 'development',
  entry: {
    ...Object.keys(PATHS).reduce((acc, key) => {
      if (PATHS[key].sources && PATHS[key].key) {
        acc[PATHS[key].key] = `${PATHS[key].sources}/app/app.js`;
      }
      return acc;
    }, {})
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
  resolve: {
    alias: {
      react: resolve('./node_modules/react'),
      'react-dom': resolve('./node_modules/react-dom'),
      'prop-types': resolve('./node_modules/prop-types'),
      classnames: resolve('./node_modules/classnames'),
      '@jetbrains/hub-widget-ui': resolve('./node_modules/@jetbrains/hub-widget-ui'),
      'hub-dashboard-addons': resolve('./node_modules/hub-dashboard-addons'),
      '@jetbrains/ring-ui': resolve('./node_modules/@jetbrains/ring-ui')
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
        loader: 'babel-loader',
        options: {
          presets: [require.resolve('@jetbrains/babel-preset-jetbrains')],
          // plugins: [require.resolve('babel-plugin-transform-decorators-legacy')]
        }
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
    port: '9011',
    devMiddleware: {
      stats: 'minimal'
    },
    client: {
      overlay: {
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
