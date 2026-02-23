import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Must be a valid email address' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongP@ssword123',
        description: 'User password',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RegisterDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the user',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Must be a valid email address' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongP@ssword123',
        description: 'User password (min 8 characters)',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    access_token: string;

    @ApiProperty({
        example: { id: 'clx...', email: 'john@example.com', name: 'John Doe' },
    })
    user: {
        id: string;
        email: string;
        name: string;
    };
}

export class ForgotPasswordDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address to send resetting link',
    })
    @IsEmail({}, { message: 'Must be a valid email address' })
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        example: 'token_from_email_12345',
        description: 'The reset token sent via email',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        example: 'NewStrongP@ssword123',
        description: 'New password (min 8 characters)',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    newPassword: string;
}
