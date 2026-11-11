import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './producto.entity';
import { CatalogoService } from './catalogo.service';
import { PRODUCTOS_EJEMPLO } from './productos-ejemplo';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  providers: [CatalogoService],
  exports: [CatalogoService],
})
export class CatalogoModule implements OnApplicationBootstrap {
  private readonly logger = new Logger('Catalogo');

  constructor(@InjectRepository(Producto) private readonly productos: Repository<Producto>) {}

  /** Si la tabla está vacía, carga el catálogo de ejemplo. */
  async onApplicationBootstrap() {
    if ((await this.productos.count()) === 0) {
      await this.productos.save(PRODUCTOS_EJEMPLO);
      this.logger.log(`Catálogo vacío: cargué ${PRODUCTOS_EJEMPLO.length} productos de ejemplo.`);
    }
  }
}
