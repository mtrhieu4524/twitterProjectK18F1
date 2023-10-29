import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'

class UsersService {
  async checkEmailExist(email: string) {
    // vào database tìm user có email này
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
    // * boolean ép kiểu obj = true || null = false *
  }

  // ======================================================================================================================

  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        /* 
            * trong payload có dob sẵn * 
        => nên xuống dưới ép kiểu nó
        */
        date_of_birth: new Date(payload.date_of_birth),
        // => ép kiểu date_of_birth về kiểu ng dùng truyền lên

        password: hashPassword(payload.password)
      })
    )

    // lấy user_id account vừa tạo
    const user_id = result.insertedId.toString()
    // từ user_id tạo ra 1 access token và 1 refresh token
    const [access_token, refresh_token] = await Promise.all([
      // Promise.all để chạy song song 2 cái
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    return { access_token, refresh_token }
  }

  // ======================================================================================================================

  async login(user_id: string) {
    // dùng cái user_id đó tạo access và refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    //return 2 token cho controller

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    return { access_token, refresh_token }
  }

  // ======================================================================================================================

  async logout(refresh_token: string) {
    // dùng refresh_token tìm và xóa
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
  // ======================================================================================================================

  /*
      Hàm nhận vào user_id và bỏ vào payload để tạo access và refresh_token
  */
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRED_IN
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRED_IN
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([
      // Promise.all để chạy song song 2 cái
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
  }
}

const usersService = new UsersService()
export default usersService
