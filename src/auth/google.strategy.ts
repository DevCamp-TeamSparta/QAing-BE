import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['email', 'profile'],
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    accessToken,
    refreshToken,
    profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('Received access token:', accessToken);
      console.log('Received refresh token:', refreshToken);
      console.log('Received profile:', profile);
      const { emails, displayName, photos } = profile;
      const user = {
        userEmail: emails[0].value,
        userName: displayName,
        userProfile: photos[0].value,
        accessToken,
        refreshToken,
      };
      const userInDB = await this.authService.findOrCreate(user);
      done(null, userInDB);
    } catch (error) {
      console.error('Error during Google authentication:', error);
      return done(error, false);
    }
  }
}
