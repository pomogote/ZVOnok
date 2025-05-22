const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Путь к точке входа
  entry: path.resolve(__dirname, 'src', 'index.js'),

  // Выходной бандл
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true, // очищает папку dist перед сборкой
  },

  // Режим: development или production
  mode: process.env.NODE_ENV || 'development',

  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'), // для импорта через @/
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,       
        exclude: /node_modules/,    
        use: {
          loader: 'babel-loader',  
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          'postcss-loader' // если используете Tailwind/PostCSS
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      filename: 'index.html'
    })
  ],

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
    hot: true,
    open: true
  },

  devtool: 'source-map'
};
