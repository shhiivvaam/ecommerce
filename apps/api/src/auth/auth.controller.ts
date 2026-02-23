import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({
    summary: 'Login a user',
    description:
      'Authenticate with email and password and receive a JWT token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new customer account. Returns a JWT token on success.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email already in use or invalid data',
  })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset email',
    description: 'Send a password reset link to the user email.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent',
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Reset password using the token sent to the email.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
