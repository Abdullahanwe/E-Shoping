import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'Check_field-Exist', async: false })
export class CheckAnyFieldsAreApplied implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        console.log({ value, args, matchWith: args.constraints[0], matchedWithValue: args.object[args.constraints[0]] });

        return Object.keys(args.object).length > 0 &&
            Object.values(args.object).filter((arg) => {
                return arg != undefined;
            }).length > 0;
    };
    defaultMessage(validationArguments?: ValidationArguments): string {
        return `All Updated Fields are empty`
    }
}

export function ContainField(validationOptions?: ValidationOptions) {
    return function (constructor: Function) {
        registerDecorator({
            target: constructor,
            propertyName: undefined!,
            options: validationOptions,
            constraints: [],
            validator: CheckAnyFieldsAreApplied,
        });
    };
}