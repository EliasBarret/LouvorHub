import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Cards de estatísticas do usuário' })
  getStats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user.id);
  }

  @Get('escalacoes')
  @ApiOperation({ summary: 'Próximas escalações do usuário' })
  getEscalacoes(@CurrentUser() user: any) {
    return this.dashboardService.getEscalacoes(user.id);
  }
}
