
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';

interface AuthCache {
  uid: string;
  result: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    const authCache = await this.cacheManager.get<AuthCache>(token);

    if (authCache) {
      request.uid = authCache.uid;
      return authCache.result;
    }

    let uid = '';
    let result = false;
    let ttl = 60 * 30 * 1000;

    try {
      const decodedToken = await this.firebase.auth.verifyIdToken(token, true);

      if (decodedToken) {
        request.uid = uid;
        uid = decodedToken.uid;
        ttl = decodedToken.exp - decodedToken.auth_time;
        result = true;
      }
    } catch (error) {
      console.log(error);
    } finally {
      await this.cacheManager.set(token, { result, uid }, ttl);
    }

    request.uid = uid;
    return result;
  }
}
