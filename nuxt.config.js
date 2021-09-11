export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: '北科課程好朋友',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '北科課程好朋友，提供臺北科技大學最新課程資訊，以友善的介面與衝堂偵測等功能讓選課過程更加輕鬆。' }
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/icon.png' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&family=Roboto+Condensed:wght@400;700&family=Roboto+Mono&display=swap' },
      { rel: 'stylesheet', href: 'https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css' }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    'vuesax/dist/vuesax.css',
    '@/assets/main.sass'
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    '@/plugins/vuesax'
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    // https://www.npmjs.com/package/@nuxtjs/google-gtag
    '@nuxtjs/google-gtag',
    // https://www.npmjs.com/package/@nuxtjs/markdownit
    '@nuxtjs/markdownit',
  ],

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {},

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
  },
  pwa: {
    icon: {
      fileName: 'icon-pwa.png'
    },
    manifest: {
      name: '北科課程好朋友',
      short_name: '北科課程好朋友',
      description: '北科課程好朋友，提供臺北科技大學最新課程資訊，以友善的介面與衝堂偵測等功能讓選課過程更加輕鬆。',
      lang: 'zh-TW',
      shortcuts: [{
        name: "我的課程",
        url: "/ntut-course-web/my-course?utm_source=homescreen",
        icons: [{
          src: "/ntut-course-web/img/user.png",
          type: "image/png",
          sizes: "512x512"
        }]
      }, {
        name: "上課時間表",
        url: "/ntut-course-web/class?utm_source=homescreen",
        icons: [{
          src: "/ntut-course-web/img/table.png",
          type: "image/png",
          sizes: "512x512"
        }]
      }, {
        name: "搜尋",
        url: "/ntut-course-web/search?utm_source=homescreen",
        icons: [{
          src: "/ntut-course-web/img/search.png",
          type: "image/png",
          sizes: "512x512"
        }]
      }],
    },
    meta: {
      name: '北科課程好朋友',
      description: '提供臺北科技大學最新課程資訊',
      ogHost: 'https://ntut-course.gnehs.net/',
      ogImage: 'og.jpg'
    },
    theme_color: '#FFF',
    nativeUI: true
  },
  'google-gtag': {
    id: 'G-6V6Y6MHKGE'
  }
}
