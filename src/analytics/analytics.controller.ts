import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


@Controller('analytics')
@UseGuards(OrganizationScopeGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(organization.id, query);
  }

  @Get('monthly-expenses')
  getMonthlyExpenses(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMonthlyExpenses(organization.id, query);
  }

  @Get('category-breakdown')
  getCategoryBreakdown(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCategoryBreakdown(organization.id, query);
  }

  @Get('payment-method-breakdown')
  getPaymentMethodBreakdown(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPaymentMethodBreakdown(organization.id, query);
  }

  @Get('vendor-breakdown')
  getVendorBreakdown(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getVendorBreakdown(organization.id, query);
  }

  @Get('currency-breakdown')
  getCurrencyBreakdown(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCurrencyBreakdown(organization.id, query);
  }

  @Get('recurring-expenses')
  getRecurringExpenses(@CurrentOrganization() organization: { id: string }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRecurringExpenses(organization.id, query);
  }
}
