import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRoute = Router()

usersRoute.get('/login', loginValidator, wrapAsync(loginController))

usersRoute.post('/register', registerValidator, wrapAsync(registerController))

/*
        --- DESCRIPTION ---
             Đăng xuất
    path: /users/logout
    method: POST
    header: (Authorization: "Bearer <access_token>")
    body: (refresh_token: string)
*/
usersRoute.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
        --- DESCRIPTION ---
            Verify Email
  - Khi ng dùng đăng kí, trong email của họ sẽ có 1 link
  trong link này đã setup sẵn 1 req kèm email_verify_token
  thì verify email là cái route cho req đó
  - method: POST
  - path: /users/verify-email
  - body: {email_verify_token: string}
*/
usersRoute.post('/verify-email', emailVerifyValidator, wrapAsync(emailVerifyController))

/*
        --- DESCRIPTION ---
        Resend Verify Email
  -> Khi  mail thất lạc , hoặc email_verify_token hết hạn, thì người dùng có
    nhu cầu resend email_verify_token
        
  - method: POST
  - headers: {Authorization: Bearer <access_token></access_token>}
*/
usersRoute.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
        --- DESCRIPTION ---
          Forgot Password
  - Khi ng dùng quên mk ng dùng cung cấp email cho mình
  mình sẽ xem có user nào sở hữu email đó kh? 
  nếu có thì mình sẽ tạo 1 forgot_password_token và gửi vào email của userđó
  - method: POST
  - path: /users/forgot-password
  - body: {email: string}
*/
usersRoute.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
          --- DESCRIPTION ---
            Forgot Password

  -> Khi người dùng nhấp vào link trong email để reset password họ sẽ gữi 1 req kèm theo forgot_password_ _token lên server server sẽ kiểm tra forgot_password_token có hợp lệ hay không ?
      sau đó chuyến hướng người dùng đến trang reset password
      
  - path: /verify-forgot-password
  - method: POST
  - Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
  - body: {forgot_password_token: string}
*/
usersRoute.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

/*
          --- DESCRIPTION ---
            Reset Password
  - path: '/reset-password'
  - method: POST
  - Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
  - body: {forgot_password_token: string, password: string, confirm_password: string}
*/
usersRoute.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)

/*
          --- DESCRIPTION ---
          Get profile của user
          
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRoute.get('/me', accessTokenValidator, wrapAsync(getMeController))

export default usersRoute
