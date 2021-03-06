import { createBgColorTypes } from './bgColorTypes';
import { createBlockTypes } from './blockTypes';
import { createColorTypes } from './colorTypes';
import { createDataTypes } from './dataTypes';
import { createFunctionNames } from './functionNames';
import { createOperationCommands } from './operationCommands';
import { createSchemaUnitTypes } from './schemaUnitTypes';
import { createViewTypes } from './viewTypes';

export const NotionConstants = {
	blockTypes: createBlockTypes,
	viewTypes: createViewTypes,
	schemaUnitTypes: createSchemaUnitTypes,
	dataTypes: createDataTypes,
	operationCommands: createOperationCommands,
	functionNames: createFunctionNames,
	colorTypes: createColorTypes,
	bgColorTypes: createBgColorTypes
};
