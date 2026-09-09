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

  // PaaS(Render 등)는 PORT 를 주입하고 0.0.0.0 바인딩을 요구함
  const port = process.env.PORT ?? 3001
  await app.listen(port, '0.0.0.0')
  console.log(`API 서버 실행 중 (port ${port})`)
}
bootstrap()
