import { kitLabelsSource } from './db';

/**
 * The words the kit's server code sends back to the screen: the flash after a save, a refusal,
 * an upload error. English unless the app gives `configureKit` a `labels` function, which is
 * called each time a message is made — so it reads the language of the request being answered
 * (paraglide's server middleware keeps that per request):
 *
 *     configureKit({ db, labels: () => ({ crudAdded: (x) => m.kit_crud_added({ x }), … }) });
 */
export type ServerLabels = {
	crudAdded: (label: string) => string;
	crudUpdated: (label: string) => string;
	crudDeleted: (label: string) => string;
	crudCouldNotAdd: (label: string) => string;
	crudCouldNotUpdate: (label: string) => string;
	crudCouldNotDelete: (label: string) => string;
	crudCheckForm: string;
	crudInvalidRequest: string;
	crudExists: (label: string) => string;
	crudGone: (label: string) => string;
	lookupNoneSelected: (label: string) => string;
	lookupNotFound: (label: string) => string;
	lookupDeleted: (label: string) => string;
	noFile: string;
	fileTooLarge: (megabytes: number) => string;
	fileTypeRefused: string;
	noPermission: string;
	signInRequired: string;
	superAdminOnly: string;
	notFound: string;
};

export const englishServerLabels: ServerLabels = {
	crudAdded: (label) => `${label} added`,
	crudUpdated: (label) => `${label} updated`,
	crudDeleted: (label) => `${label} deleted`,
	crudCouldNotAdd: (label) => `Could not add ${label}`,
	crudCouldNotUpdate: (label) => `Could not update ${label}`,
	crudCouldNotDelete: (label) => `Could not delete ${label}`,
	crudCheckForm: 'Please check the form for errors',
	crudInvalidRequest: 'Invalid request',
	crudExists: (label) => `That ${label.toLowerCase()} already exists.`,
	crudGone: (label) => `That ${label.toLowerCase()} no longer exists.`,
	lookupNoneSelected: (label) => `No ${label} was selected.`,
	lookupNotFound: (label) => `That ${label} was not found.`,
	lookupDeleted: (label) => `${label} deleted.`,
	noFile: 'No file was uploaded.',
	fileTooLarge: (megabytes) => `That file is larger than ${megabytes}MB.`,
	fileTypeRefused: 'That file type is not accepted.',
	noPermission: 'You do not have permission to do that.',
	signInRequired: 'Sign in to do that.',
	superAdminOnly: 'Only a super administrator can delete records.',
	notFound: 'Not found'
};

/** The labels for the message being made now: the app's where it gave one, else English. */
export function serverLabels(): ServerLabels {
	const given = kitLabelsSource()?.() ?? {};
	return { ...englishServerLabels, ...given } as ServerLabels;
}

/** A label that may be a function, so an app can name a record in the request's language. */
export type Label = string | (() => string);

export const labelText = (label: Label) => (typeof label === 'function' ? label() : label);
