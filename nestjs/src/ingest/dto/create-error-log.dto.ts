import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  project_id!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  error_message!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100_000)
  stack_trace!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  environment!: string;
}

/**
 * Queue payload includes tenant_id resolved by ApiKeyGuard (not from the client body).
 */
export type ErrorLogJobPayload = CreateErrorLogDto & {
  tenant_id: string;
};
