import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role: WorkspaceRole;
}
