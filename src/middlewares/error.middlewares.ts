import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

// trong error có msg với status
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  /*
    - Nơi tập kết lỗi từ mọi nơi trên hệ thống lỗi
    - Nếu lỗi nhận đc thuộc dạng ErrorWithStatus thì trả về status và message
  */
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
    // _.omit: Bỏ 1 thuộc tính của object, lấy toàn bộ những thuộc tính còn lại
  }

  /*
    - Còn nếu code mà chạy xuống đc đây thì error sẽ là 1 lỗi mặc định
    err(message, stack, name)
  */
  Object.getOwnPropertyNames(err).forEach((key) => {
    /*
      Object.getOwnPropertyNames(err): 
        => Hàm lấy ra các thuộc tính có [enumerable là false và true]
    */
    Object.defineProperty(err, key, { enumerable: true })
    /*
      Set các key đó thành true
    */
  })

  // ném lỗi cho ng dùng
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
    // *** STACK là sự kết hợp giữa name và các đường dẫn ***
  })
}
