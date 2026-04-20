import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo usuário (envia e-mail de verificação)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário e obter JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar senha provisória por e-mail' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Confirmar e-mail com token enviado por e-mail' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Reenviar e-mail de verificação' })
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
