module.exports = function (api) {
  const isWeb = api.env('web');
  api.cache(() => isWeb);
  
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react',
        },
      ],
    ],
    plugins: [
      // Only use transform-runtime for web; Expo handles native transpilation
      isWeb && [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers: true,
          regenerator: true,
        },
      ],
      'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
};
