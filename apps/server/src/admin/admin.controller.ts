import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('balance')
    async getBalance() {
        return await this.adminService.getBalance();
    }

    @Put('balance')
    async updateBalance(@Body() balance: any) {
        await this.adminService.updateBalance(balance);
        return { message: 'Balance updated successfully' };
    }

    @Put('balance/:section')
    async updateBalanceSection(@Request() req, @Body() data: any) {
        const section = (req as any).params.section;
        await this.adminService.updateBalanceSection(section, data);
        return { message: `Section ${section} updated successfully` };
    }
}

