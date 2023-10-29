import { RequestHandler, Request, Response, NextFunction } from 'express'

export const wrapAsync = (func: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await func(req, res, next)

    /*  *** QUAN TRỌNG ***
        func sẽ là hàm async đưa về 1 PROMISE
          - Nếu là 1 promise thì lúc xài phải await
          - Vì có await nên bọc async 
      */
  } catch (error) {
    next(error)
  }
}
