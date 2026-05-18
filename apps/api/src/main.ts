import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS 허용 (모바일 앱에서 API 호출 가능하도록)
  app.enableCors()

  // 모든 API 경로 앞에 /api 붙이기 (예: /api/symptoms)
  app.setGlobalPrefix('api')

  // DTO 유효성 검사 자동 적용
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`API 서버 실행 중: http://localhost:${port}/api`)
}
bootstrap()
