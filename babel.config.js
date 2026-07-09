module.exports = function(api) {
  const isTest = api.env('test');
  api.cache(() => process.env.BABEL_ENV || process.env.NODE_ENV || 'development');

  return {
    presets: [
      ['babel-preset-expo', { worklets: !isTest }],
    ],
    plugins: [],
  };
};
