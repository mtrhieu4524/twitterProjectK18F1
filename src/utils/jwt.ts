import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { TokenPayload } from '~/models/requests/User.request'
config()

// * hàm nhận vào payload, privateKey, options từ đó kí tên
export const signToken = ({
  // biến 2 parameter thành object

  payload,
  privateKey = process.env.JWT_SECRET as string, // nếu trong quá trình k nói thì đưa pwd gốc
  options = { algorithm: 'HS256' }
}: {
  // định nghĩa object

  payload: string | object | Buffer
  privateKey?: string
  options?: jwt.SignOptions
}) => {
  // * Định nghĩa Promise đưa về chuỗi *
  return new Promise<string>((resolve, reject) => {
    /*
      (error, token) => là call back dùng để xử lí lỗi
    */
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      resolve(token as string)
    })
  })
}

// ======================================================================================================================q

// Hàm kiểm tra token có phải của mình tạo ra k
//  nếu có thì trả ra payload
export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  //trả về JwtPayload(thông tin người gữi req) nếu token hợp lệ
  return new Promise<TokenPayload>((resolve, reject) => {
    //method này sẽ verify token, nếu token hợp lệ thì nó sẽ trả về payload
    //nếu token không hợp lệ thì nó sẽ throw error
    //secretOrPublicKey dùng để verify token
    //nếu token được tạo ra bằng secret|PublicKey thì ta dùng secret | PublicKey key để verify
    //từ đó biết rằng access_token được tạo bởi chính server
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as TokenPayload)
    })
  })
}
