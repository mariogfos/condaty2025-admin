const config = {
  app: {
    appName: process.env.NEXT_PUBLIC_APP_NAME,
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    appLogoImage: process.env.NEXT_PUBLIC_APP_LOGO,
    loginUser: process.env.NEXT_PUBLIC_APP_LOGIN_USER,
    loginPass: process.env.NEXT_PUBLIC_APP_LOGIN_PASS,
  },
  auth: {
    login: process.env.NEXT_PUBLIC_AUTH_LOGIN,
    register: process.env.NEXT_PUBLIC_AUTH_REGISTER,
    logout: process.env.NEXT_PUBLIC_AUTH_LOGOUT,
    success: process.env.NEXT_PUBLIC_AUTH_SUCCESS,
    iam: process.env.NEXT_PUBLIC_AUTH_IAM,
    fail: process.env.NEXT_PUBLIC_AUTH_FAIL,
  },
};

export default config;
