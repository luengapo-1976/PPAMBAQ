import { Injectable } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { PasswordService } from '../common/security/password.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly passwordService: PasswordService,
  ) {}

  findAll() {
    return this.usuariosRepository.findAll();
  }

  async create(dto: CreateUsuarioDto) {
    const passwordHash = await this.passwordService.hash(dto.password);
    return this.usuariosRepository.create({
      login: dto.login,
      rol: dto.rol,
      password_hash: passwordHash,
      correo: dto.correo || null,
      movil: dto.movil || null,
    });
  }

  async update(login: string, dto: UpdateUsuarioDto) {
    const passwordHash = dto.password ? await this.passwordService.hash(dto.password) : undefined;
    return this.usuariosRepository.update(login, {
      rol: dto.rol,
      correo: dto.correo || null,
      movil: dto.movil || null,
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    });
  }
}
