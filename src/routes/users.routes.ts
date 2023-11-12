import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.request'
import { wrapAsync } from '~/utils/handlers'
const usersRoute = Router()

usersRoute.post('/login', loginValidator, wrapAsync(loginController))

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

  -> Khi người dùng nhấp vào link trong email để reset password họ sẽ gữi 1 req kèm theo forgot_password_token lên server 
      server sẽ kiểm tra forgot_password_token có hợp lệ hay không ?
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

usersRoute.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

/*
          --- DESCRIPTION ---
  Get profile của user khác bằng unsername 
  - path: '/:username'
  - method: get
  - không cần header vì, chưa đăng nhập cũng có thể xem
*/
usersRoute.get('/:username', wrapAsync(getProfileController))

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
usersRoute.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))

/*
    des: unfollow someone
    path: '/follow/:user_id'
    method: delete
    headers: {Authorization: Bearer <access_token>}
    */
usersRoute.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)

//unfollowValidator: kiểm tra user_id truyền qua params có hợp lệ hay k?

/*
  des: change password
  path: '/change-password'
  method: PUT
  headers: {Authorization: Bearer <access_token>}
  Body: {old_password: string, password: string, confirm_password: string}
g}
  */

usersRoute.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

/*
  des: refreshtoken
  path: '/refresh-token'
  method: POST
  Body: {refresh_token: string}
g}
  */
usersRoute.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà

usersRoute.get('/oauth/google', wrapAsync(oAuthController))
export default usersRoute
