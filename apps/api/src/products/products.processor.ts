import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProductsService } from './products.service';

@Processor('products_import')
export class ProductsProcessor extends WorkerHost {
  constructor(private readonly productsService: ProductsService) {
    super();
  }

  async process(
    job: Job<
      | { csvString: string; userId: string }
      | { excelFilePath: string; userId: string },
      any,
      string
    >,
  ): Promise<any> {
    switch (job.name) {
      case 'import-csv': {
        const { csvString, userId } = job.data as {
          csvString: string;
          userId: string;
        };
        return this.productsService.processCsvImport(csvString, userId);
      }
      case 'import-excel': {
        const { excelFilePath, userId } = job.data as {
          excelFilePath: string;
          userId: string;
        };
        return this.productsService.processExcelImport(excelFilePath, userId);
      }
    }
  }
}
