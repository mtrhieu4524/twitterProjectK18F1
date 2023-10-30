import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
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

export default usersRoute
