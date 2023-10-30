import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LogoutReqBody, RegisterReqBody, EmailVerifyReqBody, TokenPayload } from '~/models/requests/User.request'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'

export const loginController = async (req: Request, res: Response) => {
  // vào req lấy user ra, và lấy _id của user đó
  const user = req.user as User
  const user_id = user._id as ObjectId

  // * id lấy từ trên mongoDB xuống nên là phải toString() *

  // dùng cái user_id đó tạo access và refresh_token
  const result = await usersService.login(user_id.toString())
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
  // đồng thời trong req sẽ có decoded_email_verify_token
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  // tìm xem có user có mã này kh
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // nếu có user đó thì mình sẽ kiểm tra xem user đó lưu email_verify_token kh ?
  if (user.email_verify_token === '') {
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
