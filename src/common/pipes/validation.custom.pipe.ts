import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ZodType } from "zod";



@Injectable()
export class CustomValidationPipe implements PipeTransform {
    constructor(private readonly schema: ZodType) { }
    transform(value: any, metadata: ArgumentMetadata) {
        const { error, success } = this.schema.safeParse(value);
        if (!success) {
            throw new BadRequestException({
                message: 'Validation Error',
                cause: {
                    issues: error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message }
                    })
                }
            })
        }
        return value;
    }
}