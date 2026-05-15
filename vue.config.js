module.exports = {
  // 👇 КЛЮЧЕВАЯ НАСТРОЙКА: базовый путь для всех ассетов
  publicPath: "/pck/",

  // 👇 Папка сборки (относительно корня проекта фронтенда)
  outputDir: "dist",

  devServer: {
    port: 9000,
  },
  chainWebpack: (config) => {
    config.plugin("define").tap((definitions) => {
      definitions[0]["__VUE_PROD_HYDRATION_MISMATCH_DETAILS__"] =
        JSON.stringify(false);
      return definitions;
    });
  },
};
