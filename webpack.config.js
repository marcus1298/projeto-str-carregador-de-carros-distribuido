const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const nodeExternals = require('webpack-node-externals');

module.exports = (options, webpack) => {
  return {
    ...options,
    externals: [nodeExternals()],
    plugins: [
      ...options.plugins,
      sentryWebpackPlugin({
        org: "jarvisx-id",
        project: "star-ev",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    devtool: 'source-map',
  };
};
