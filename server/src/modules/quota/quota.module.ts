import { Module } from "@nestjs/common";
import { QuotaController } from "./quota.controller";
import { QuotaService } from "./quota.service";

@Module({
  controllers: [QuotaController],
  providers: [QuotaService],
})
export class QuotaModule {}
