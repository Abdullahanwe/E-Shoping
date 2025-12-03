import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticationService } from './module/auth/auth.service';

// localhost:3000/
@Controller()
export class AppController {
  constructor(private readonly appService: AppService,

  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('hi')
  sayHi(): string {
    return `Hello Nest.js`;
  }

  
}
