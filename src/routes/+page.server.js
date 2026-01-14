export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		console.log(formData);
	},
};

export function load({ cookies }) {
	let id = cookies.get('userid');

	if (!id) {
		id = crypto.randomUUID();
		cookies.set('userid', id, { path: '/' });
	}

	// return {
	// 	todos: db.getTodos(id)
	// };
}