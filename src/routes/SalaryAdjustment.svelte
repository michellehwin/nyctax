<script lang="ts">
	import { onMount } from 'svelte';

	let { id, decr_sal_adj, edit_adj } = $props();
	function remove_salary_adjustment(e: { srcElement: any }) {
		const el = document.getElementById(`salary-increase-div-${id}`);
		console.log(el);
		el?.remove();
		decr_sal_adj();
	}
	let adj = $state(40000);
	let year = $state(26);
	const onChange = () => {
		edit_adj(id, adj, year);
	};
</script>

<div id="salary-increase-div-{id}" class="my-2 flex items-center gap-2">
	<div>
		<label for="salary-increase-{id}" class="mb-2 block text-xs font-medium text-gray-900"
			>Adjustment</label
		>
		<input
			type="number"
			id="salary-increase-{id}"
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
			bind:value={adj}
			onchange={onChange}
		/>
	</div>
	<div>
		<label for="salary-increase-year-{id}" class="mb-2 block text-xs font-medium text-gray-900"
			>at age</label
		>
		<input
			type="number"
			id="salary-increase-year-{id}"
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
			bind:value={year}
			onchange={onChange}
		/>
	</div>
	<button
		type="button"
		class="rounded-lg text-sm text-red-500"
		onclick={(e) => remove_salary_adjustment(e)}
		aria-label="Remove Salary Adjustment"
	>
		<svg
			fill="#dc2626"
			height="15px"
			width="15px"
			version="1.1"
			id="Capa_1"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 460.775 460.775"
			xml:space="preserve"
			><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
				id="SVGRepo_tracerCarrier"
				stroke-linecap="round"
				stroke-linejoin="round"
			></g><g id="SVGRepo_iconCarrier">
				<path
					d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
				></path>
			</g></svg
		>
	</button>
</div>
