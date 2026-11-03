import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ListErrorLogsQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  tenant_id!: string;
}
