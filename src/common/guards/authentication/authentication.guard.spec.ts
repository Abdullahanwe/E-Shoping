// import { AuthenticationGuard } from './authentication.guard';

// describe('AuthenticationGuard', () => {
//   it('should be defined', () => {
//     expect(new AuthenticationGuard()).toBeDefined();
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from './authentication.guard';
import {TokenSecurity}  from 'src/common/utils/security/token.security';
import { Reflector } from '@nestjs/core';

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationGuard,
        Reflector,
        {
          provide: TokenSecurity,
          useValue: {
            decodedToken: jest.fn().mockResolvedValue({
              decoded: {},
              user: {},
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthenticationGuard>(AuthenticationGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
