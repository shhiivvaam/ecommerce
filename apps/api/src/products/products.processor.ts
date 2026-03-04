import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProductsService } from './products.service';

@Processor('products_import')
export class ProductsProcessor extends WorkerHost {
  constructor(private readonly productsService: ProductsService) {
    super();
  }

  async process(
    job: Job<{ csvString: string; userId: string }, any, string>,
  ): Promise<any> {
    switch (job.name) {
      case 'import-csv': {
        const { csvString, userId } = job.data;
        return this.productsService.processCsvImport(csvString, userId);
      }
    }
  }
}
