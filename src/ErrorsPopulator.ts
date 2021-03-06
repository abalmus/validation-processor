import { Validation } from './ValidationProcessor';
import { keys, values, first, filter } from 'lodash';

interface ErrorsPopulatorI {
    getByField(fieldName: string): Promise<any>;
}

export class ErrorsPopulator implements ErrorsPopulatorI {
    constructor(private validationProcessor: Validation.ValidationProcessor) {
        this.validationProcessor = validationProcessor;
    }

    public errorConverter(errors: any[]) {
        const convertedErrors = {};

        keys(errors).map(key => {
            convertedErrors[errors[key].ruleName] = errors[key].reason;
        });

        return convertedErrors;
    }

    public getAll(fieldNames: string[]) {
        const errors = {};

        fieldNames.length && fieldNames.map(fieldName => {
            if (!this.validationProcessor.isDisabled(fieldName)) {
                errors[fieldName] = this.errorConverter(
                    Object.assign({}, this.validationProcessor.processorQueue.process(fieldName)),
                );
            }
        })

        return errors;
    }

    public getByField(fieldName: string) {
        return new Promise((resolve, reject) => {
            if (first(keys(this.validationProcessor.asyncProcessorQueue.process(fieldName)))) {
                return Promise.all(values(this.validationProcessor.asyncProcessorQueue.process(fieldName)))
                    .then((result) => {console.log(result);})
                    .catch((resultedReason) => {
                        const { ruleName, reason } = JSON.parse(resultedReason.message);
                        const syncError = {};

                        syncError[fieldName + '__' + ruleName] = { fieldName, ruleName, reason };

                        resolve(
                            this.errorConverter(
                                Object.assign(
                                    {},
                                    this.validationProcessor.processorQueue.process(fieldName),
                                    syncError
                                ),
                            ),
                        );
                    });
            } else {
                resolve(
                    this.errorConverter(
                        Object.assign({}, this.validationProcessor.processorQueue.process(fieldName)),
                    ),
                );
            }
        });
    }
}
