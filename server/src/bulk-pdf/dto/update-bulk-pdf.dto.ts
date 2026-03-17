import { PartialType } from '@nestjs/swagger';
import { CreateBulkPdfDto } from './create-bulk-pdf.dto';

export class UpdateBulkPdfDto extends PartialType(CreateBulkPdfDto) {}
