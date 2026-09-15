import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/** SupabaseAuthGuard 가 실어준 검증된 user.id 를 꺼낸다. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest()
    return req.userId
  },
)
