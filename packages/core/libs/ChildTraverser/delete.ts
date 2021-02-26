import { updateChildContainer } from '@nishans/fabricator';
import { Operation } from '@nishans/operations';
import { TData } from '@nishans/types';
import { FilterTypes, IterateAndDeleteChildrenOptions } from '../../types';
import { deepMerge } from '../utils';
import { getChildIds, iterateChildren, updateLastEditedProps } from './utils';

/**
 * Iterates over the children of a parent and deletes it
 * @param args Array of ids or a cb passed with the transformed data
 * @param transform Cb to get the data using the id
 * @param options Options for delete function
 * @param cb additional callback
 */
export const remove = async <T extends TData, TD, C = any[]>(
	args: FilterTypes<TD>,
	transform: ((id: string) => TD | undefined | Promise<TD | undefined>),
	options: IterateAndDeleteChildrenOptions<T, C>,
	cb?: ((id: string, data: TD, container: C) => any)
) => {
	const {
			container,
			child_path,
			user_id,
			multiple = true,
			manual = false,
			parent_id,
			child_type,
			logger,
			stack,
			cache,
			parent_type,
			child_ids,
			token
		} = options,
		// get the data from the cache
		parent_data = cache[parent_type].get(parent_id) as T;

	const updateData = async (child_id: string, child_data: TD) => {
		cb && (await cb(child_id, child_data, container));
		logger && logger('DELETE', child_type, child_id);

		let last_edited_props = {};
		// If the update is not manual,
		if (!manual) {
			const updated_data = { alive: false };

			// Only attach last_edited_props if the child_type is block
			if (child_type.match(/^(block|space)$/)) last_edited_props = updateLastEditedProps(child_data, user_id);

			deepMerge(child_data, updated_data);

			// Push the updated block data to the stack
			stack.push(Operation[child_type].update(child_id, [], { ...updated_data, ...last_edited_props }));

			if (typeof child_path === 'string')
				await updateChildContainer(parent_type, parent_id, false, child_id, cache, stack, token);
		}
	};

	await iterateChildren<TD, boolean>({ args, cb: updateData, method: 'DELETE' }, transform, {
		child_ids: getChildIds(child_ids, parent_data),
		multiple,
		child_type,
		parent_id,
		parent_type
	});

	// if parent data exists, update the last_edited_props for the cache and push to stack
	if (parent_type.match(/^(block|space)$/))
		stack.push(Operation[parent_type].update(parent_id, [], updateLastEditedProps(parent_data, user_id)));

	return container;
};
