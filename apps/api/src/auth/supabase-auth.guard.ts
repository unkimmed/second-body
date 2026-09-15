import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

/**
 * Authorization: Bearer <supabase access token> 을 검증한다.
 * supabase.auth.getUser(token) 으로 확인 후, 검증된 user.id 를 req.userId 에 실어준다.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const header: string | undefined = req.headers?.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) throw new UnauthorizedException('인증 토큰이 필요합니다.')

    const { data, error } = await this.supabase.client.auth.getUser(token)
    if (error || !data.user) throw new UnauthorizedException('유효하지 않은 토큰입니다.')

    req.userId = data.user.id
    return true
  }
}
