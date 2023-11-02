import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  LogoutReqBody,
  RegisterReqBody,
  EmailVerifyReqBody,
  TokenPayload,
  ForgotPasswordReqBody,
  VerifyForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  GetProfileReqParams
} from '~/models/requests/User.request'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'

export const loginController = async (req: Request, res: Response) => {
  // vào req lấy user ra, và lấy _id của user đó
  const user = req.user as User
  const user_id = user._id as ObjectId

  // * id lấy từ trên mongoDB xuống nên là phải toString() *

  // dùng cái user_id đó tạo access và refresh_token
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  // nếu k bug j thì thành công lun
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

// ======================================================================================================================

// ** req đc định nghĩa của interface RegisterReqBody bên "User.request.ts" **
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  // tạo 1 user mới và bỏ vào collection users trong database
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

// ======================================================================================================================

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  // lấy refresh_token từ body
  const refresh_token = req.body.refresh_token as string
  //gọi hàm logout, hàm nhận vào refresh_token tìm và xóa
  const result = await usersService.logout(refresh_token)
  res.json(result)
}

// ======================================================================================================================

export const emailVerifyController = async (req: Request<ParamsDictionary, any, EmailVerifyReqBody>, res: Response) => {
  // khi mà req vào đc đây nghĩa là email_verify_token đã valid
  // đồng thời trong req sẽ có decoded_email_verify_token [lấy đc payload]
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  // dừa vào user_id tìm user xem nó đã verify chưa ?
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.email_verify_token !== (req.body.email_verify_token as string)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }

  // nếu có user đó thì mình sẽ kiểm tra xem user đó lưu email_verify_token kh ?
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // nếu xuống đc đây nghĩa là user này chưa chưa có, và chưa verify
  // verify email là: tìm user đó bằng user_id
  //    và update tại email_verify_token thành "" và verify: 1
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

// ======================================================================================================================

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // Nếu qua đc hàm này tức là đã qua đc accessTokenValidator
  //  thì req đã có decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  // tìm user có user_id này
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu k có user thì res lỗi
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  // nếu có thì xem thử nó đã verify chưa
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  //nếu user chưa verify email thì ta sẽ gữi lại email verify cho họ
  //cập nhật email_verify_token mới và gữi lại email verify cho họ
  const result = await usersService.resendEmailVerify(user_id)
  //result chứa message nên ta chỉ cần trả  result về cho client
  return res.json(result)
}

// ======================================================================================================================

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  //middleware forgotPasswordValidator đã chạy rồi, nên ta có thể lấy _id từ user đã tìm đc bằng email
  const { _id, verify } = req.user as User
  // tiến hành tạo forgot_password_token và lưu vào user đó kèm gửi mail cho user đó
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json(result)
}

// ======================================================================================================================

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  //nếu đã đến bước này nghĩa là ta đã tìm có forgot_password_token hợp lệ
  //và đã lưu vào req.decoded_forgot_password_token
  //thông tin của user
  //ta chỉ cần thông báo rằng token hợp lệ
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

// ======================================================================================================================

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body // ***** khi nào truy cập body thì phải định nghĩa req *****
  // dùng user_id đó tìm user và update lại password
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}

// ======================================================================================================================

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  // vào database tìm user có user_id này đưa cho client
  const result = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: result
  })
}

// ======================================================================================================================

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  //middleware accessTokenValidator đã chạy rồi, nên ta có thể lấy đc user_id từ decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  //user_id để biết phải cập nhật ai
  //lấy thông tin mới từ req.body
  const { body } = req
  //lấy các property mà client muốn cập nhật
  //ta sẽ viết hàm updateMe trong user.services
  //nhận vào user_id và body để cập nhật
  const result = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS, //meesage.ts thêm
    result
  })
}

// ======================================================================================================================

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response, next: NextFunction) => {
  const { username } = req.params //lấy username từ query params
  const result = await usersService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result
  })
}
