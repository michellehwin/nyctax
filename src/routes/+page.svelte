<script lang="ts">
	import SalaryAdjustment from './SalaryAdjustment.svelte';
	import { mount, onMount } from 'svelte';
	import chartjs from 'chart.js/auto';
	import { total_nyc_tax_fica, brokerage_bal_f, fica, total_nyc_tax } from '../lib/index';
	let salary_adjustments = $state(0);
	let starting_salary = $state(100000);
	let starting_age = $state(22);
	let retire_age = $state(50);
	let yrs_retired = $state(40);
	let salary_yoy_incr = $state(3);
	let stock_market_return = $state(7);
	let monthly_expense = $state(4500);
	let contrib_401 = $state(23000);
	let employer_match = $state(7750);
	let inflation = $state(2.5);
	let retirement_pct = $state(0.7);
	let salary_adj_arr = $state([
		{ adjustment: -1, year: -1 },
		{ adjustment: -1, year: -1 },
		{ adjustment: -1, year: -1 },
		{ adjustment: -1, year: -1 },
		{ adjustment: -1, year: -1 }
	]);
	let inflation_adjustment = $state(true);

	function addSalaryAdjustment() {
		salary_adjustments += 1;
		const form = document.querySelector('.salary-adjustments');
		mount(SalaryAdjustment, {
			props: {
				id: salary_adjustments,
				decr_sal_adj: removeSalaryAdjustment,
				edit_adj: editSalaryAdjustment
			},
			target: form
		});
		form?.insertAdjacentHTML('afterend', `<SalaryAdjustment id={${salary_adjustments}} />`);
		editSalaryAdjustment(salary_adjustments, 40000, 26);
	}

	function editSalaryAdjustment(idx: any, adj: any, year: any) {
		salary_adj_arr[idx - 1] = { adjustment: adj, year: year };
	}
	function removeSalaryAdjustment() {
		salary_adjustments -= 1;
	}

	let salaryAgeArr = $derived.by(() => {
		return Array.from(
			{ length: retire_age - starting_age + 1 },
			(_, index) => starting_age + index
		);
	});

	let salaryArr = $derived.by(() => {
		let curAdj = 0;
		let arr = [starting_salary];
		for (let i = 1; i < retire_age - starting_age + 1; i++) {
			if (
				// if there is a salary adjustment for this year
				i == salary_adj_arr[curAdj].year - starting_age &&
				salary_adj_arr[curAdj].year != -1 &&
				salary_adj_arr[curAdj].year >= starting_age &&
				salary_adj_arr[curAdj].year <= retire_age
			) {
				arr.push(arr[i - 1] + salary_adj_arr[curAdj].adjustment);
				curAdj += 1;
			} else {
				arr.push(arr[i - 1] * (1 + salary_yoy_incr / 100));
			}
		}
		return arr;
	});

	let contrib401Arr = $derived.by(() => {
		// contribution to 401k grows with inflation - 1%
		if (inflation_adjustment)
			return Array.from(
				{ length: retire_age - starting_age + 1 },
				(_, index) => contrib_401 * Math.pow(1 + (inflation - 1) / 100, index)
			);
		else return Array.from({ length: retire_age - starting_age + 1 }, (_, index) => contrib_401);
	});
	let annualExpenseArr = $derived.by(() => {
		// annual expenses grow with inflation
		if (inflation_adjustment) {
			let arr = Array.from(
				{ length: retire_age - starting_age + 1 },
				(_, index) => monthly_expense * 12 * Math.pow(1 + inflation / 100, index)
			);
			let last = arr[arr.length - 1];
			// annual expenses during retirement
			for (let i = 0; i < yrs_retired; i++) {
				arr.push(last * retirement_pct * Math.pow(1 + inflation / 100, i));
			}
			return arr;
		} else {
			let arr = Array.from(
				{ length: retire_age - starting_age + 1 },
				(_, index) => monthly_expense * 12
			);
			let last = arr[arr.length - 1];
			// annual expenses during retirement
			for (let i = 0; i < yrs_retired; i++) {
				arr.push(last * retirement_pct);
			}
			return arr;
		}
	});

	let brokeragePrincipalArrTrad = $derived.by(() => {
		console.log(`salaryArr first year`, salaryArr[0]);
		console.log(`contrib401Arr first year`, contrib401Arr[0]);
		console.log(`annualExpenseArr first year`, annualExpenseArr[0]);
		console.log(`total_nyc_tax first year`, total_nyc_tax(salaryArr[0] - contrib401Arr[0]));
		console.log(`fica first year`, fica(salaryArr[0]));
		let arr = Array.from(
			{ length: retire_age - starting_age + 1 },
			(_, index) =>
				salaryArr[index] -
				contrib401Arr[index] -
				total_nyc_tax(salaryArr[index] - contrib401Arr[index]) -
				fica(salaryArr[index]) -
				annualExpenseArr[index]
		);
		console.log(`brokeragePrincipalArrTrad`, arr);
		return arr;
	});

	let brokeragePrincipalArrRoth = $derived.by(() => {
		return Array.from(
			{ length: retire_age - starting_age + 1 },
			(_, index) =>
				salaryArr[index] -
				total_nyc_tax_fica(salaryArr[index]) -
				annualExpenseArr[index] -
				contrib401Arr[index]
		);
	});

	let brokerageAgeArr = $derived.by(() => {
		return Array.from(
			{ length: retire_age - starting_age + 1 + yrs_retired },
			(_, index) => starting_age + index
		);
	});

	let employerMatchArr = $derived.by(() => {
		if (inflation_adjustment)
			return Array.from(
				{ length: retire_age - starting_age + 1 },
				(_, index) => employer_match * Math.pow(1 + (inflation - 1.2) / 100, index)
			);
		else return Array.from({ length: retire_age - starting_age + 1 }, (_, index) => employer_match);
	});

	let tradWithdrawal: number[] = [];
	let addTradWithdrawal = (val: number) => {
		tradWithdrawal.push(val);
	};

	let totalWithdrawalTrad = $derived.by(() =>
		Array.from({ length: brokerageAgeArr.length }, () => 0)
	);

	let trad401kValueArr: number[] = $derived.by(() => {
		// first year
		let arr = [
			brokerage_bal_f(
				0,
				contrib401Arr[0] / 12 + employerMatchArr[0] / 12,
				stock_market_return / 100,
				1
			)
		];
		// remaining employed years
		for (let i = 1; i < contrib401Arr.length; i++) {
			arr.push(
				brokerage_bal_f(
					arr[i - 1],
					contrib401Arr[i] / 12 + employerMatchArr[i] / 12,
					stock_market_return / 100,
					1
				)
			);
		}
		let withdrawal = Math.max.apply(Math, salaryArr) * retirement_pct;
		for (let i = 0; i < yrs_retired; i++) {
			if (arr[arr.length - 1] == 0) {
				// no more money in 401k
				arr.push(0);
				addTradWithdrawal(0);
				totalWithdrawalTrad[i + (retire_age - starting_age)] =
					totalWithdrawalTrad[i + (retire_age - starting_age) - 1];
			} else if (withdrawal < arr[arr.length - 1]) {
				arr.push(
					brokerage_bal_f(arr[arr.length - 1], (-1 * withdrawal) / 12, stock_market_return / 100, 1)
				);
				addTradWithdrawal(withdrawal);
				totalWithdrawalTrad[i + (retire_age - starting_age)] =
					withdrawal + totalWithdrawalTrad[i + (retire_age - starting_age) - 1];
			} else if (withdrawal > arr[arr.length - 1]) {
				// withdraw all money in 401k
				withdrawal = arr[arr.length - 1];
				addTradWithdrawal(withdrawal);
				totalWithdrawalTrad[i + (retire_age - starting_age)] =
					withdrawal + totalWithdrawalTrad[i + (retire_age - starting_age) - 1];
				arr.push(0);
			}
		}
		return arr;
	});

	let roth401kValueArr: number[] = $derived.by(() => {
		let arr = [
			brokerage_bal_f(
				0,
				contrib401Arr[0] / 12 + employerMatchArr[0] / 12,
				stock_market_return / 100,
				1
			)
		];
		for (let i = 1; i < contrib401Arr.length; i++) {
			arr.push(
				brokerage_bal_f(
					arr[i - 1],
					contrib401Arr[i] / 12 + employerMatchArr[i] / 12,
					stock_market_return / 100,
					1
				)
			);
		}
		let withdrawal = Math.max.apply(Math, salaryArr) * retirement_pct;
		for (let i = 0; i < yrs_retired; i++) {
			if (arr[arr.length - 1] == 0) {
				arr.push(0);
			} else if (withdrawal > arr[arr.length - 1]) {
				withdrawal = arr[arr.length - 1];
				arr.push(
					brokerage_bal_f(arr[arr.length - 1], (-1 * withdrawal) / 12, stock_market_return / 100, 1)
				);
			} else {
				arr.push(
					brokerage_bal_f(arr[arr.length - 1], (-1 * withdrawal) / 12, stock_market_return / 100, 1)
				);
			}
		}
		return arr;
	});

	let brokerageValueArrTrad: number[] = $derived.by(() => {
		let temp = trad401kValueArr;
		let arr = [brokerage_bal_f(0, brokeragePrincipalArrTrad[0] / 12, stock_market_return / 100, 1)];
		for (let i = 1; i < brokeragePrincipalArrTrad.length; i++) {
			arr.push(
				brokerage_bal_f(arr[i - 1], brokeragePrincipalArrTrad[i] / 12, stock_market_return / 100, 1)
			);
		}
		for (let i = 0; i < yrs_retired; i++) {
			let brokWithdrawal = Math.max.apply(Math, salaryArr) * retirement_pct;
			if (tradWithdrawal[i] >= brokWithdrawal)
				// already withdrew from 401k needed salary
				arr.push(brokerage_bal_f(arr[arr.length - 1], 0, stock_market_return / 100, 1));
			else {
				brokWithdrawal -= tradWithdrawal[i];
				// console.log(
				// 	'brokWithdrawal',
				// 	brokWithdrawal,
				// 	i + (retire_age - starting_age),
				// 	totalWithdrawalTrad[i + (retire_age - starting_age)],
				// 	totalWithdrawalTrad[i + (retire_age - starting_age)] + brokWithdrawal
				// );
				if (tradWithdrawal[i] == 0)
					totalWithdrawalTrad[i + (retire_age - starting_age)] += brokWithdrawal;
				else totalWithdrawalTrad[i + (retire_age - starting_age)] += brokWithdrawal;
				// console.log('totalWithdrawalTrad', totalWithdrawalTrad);
				arr.push(
					brokerage_bal_f(arr[arr.length - 1], -brokWithdrawal / 12, stock_market_return / 100, 1)
				);
			}
		}
		// console.log('totalWithdrawalTrad after brok', totalWithdrawalTrad);
		return arr;
	});

	let brokerageValueArrRoth: number[] = $derived.by(() => {
		let arr = [brokerage_bal_f(0, brokeragePrincipalArrRoth[0] / 12, stock_market_return / 100, 1)];
		for (let i = 1; i < brokeragePrincipalArrRoth.length; i++) {
			arr.push(
				brokerage_bal_f(arr[i - 1], brokeragePrincipalArrRoth[i] / 12, stock_market_return / 100, 1)
			);
		}
		for (let i = 0; i < yrs_retired; i++) {
			arr.push(
				brokerage_bal_f(
					arr[arr.length - 1],
					(-annualExpenseArr[annualExpenseArr.length - 1] * retirement_pct) / 12,
					stock_market_return / 100,
					1
				)
			);
		}
		return arr;
	});

	let salaryChart: chartjs<'line', any, number>;
	function salaryChartF(node, data) {
		function setupChart(_data) {
			salaryChart = new chartjs(node, {
				type: 'line',
				data: {
					labels: salaryAgeArr,
					datasets: [
						{
							label: 'Salary',
							data: _data
						},
						{
							label: 'Salary After Tax and Trad 401k',
							data: _data.map(
								(el, idx) => el - contrib401Arr[idx] - total_nyc_tax_fica(el - contrib401Arr[idx])
							)
						},
						{
							label: 'Salary After Tax',
							data: _data.map((el) => el - total_nyc_tax_fica(el))
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false
					},
					plugins: {
						title: {
							display: true,
							text: 'Salary'
						}
					}
				}
			});
		}
		setupChart(data);
		return {
			update(data: any) {
				salaryChart.destroy();
				setupChart(data);
			},
			destroy() {
				salaryChart.destroy();
			}
		};
	}

	let brokerageChart: chartjs<'line', any, number>;
	function brokerageChartF(node, data) {
		function setupChart(_data) {
			brokerageChart = new chartjs(node, {
				type: 'line',
				data: {
					labels: brokerageAgeArr,
					datasets: [
						{
							label: 'Brokerage Balance - Trad',
							data: _data[0]
						},
						{
							label: 'Brokerage Principal - Trad',
							data: brokeragePrincipalArrTrad
						},
						{
							label: 'Brokerage Balance - Roth',
							data: brokerageValueArrRoth
						},
						{
							label: 'Trad 401k Value',
							data: trad401kValueArr
						},
						{
							label: 'Trad Cumulative Withdrawal',
							data: _data[1]
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false
					},
					plugins: {
						title: {
							display: true,
							text: 'Investment Balances'
						}
					}
				}
			});
		}
		setupChart(data);
		return {
			update(data: any) {
				brokerageChart.destroy();
				setupChart(data);
			},
			destroy() {
				brokerageChart.destroy();
			}
		};
	}
</script>

<div class="p-5">
	<h1 class="text-lg">Retirement Calculator</h1>

	<form class="max-w-sm">
		<div class="salary-info flex gap-3">
			<div>
				<label for="starting-salary" class="my-2 block text-sm font-medium text-gray-900"
					>Starting Salary</label
				>
				<input
					type="number"
					id="starting-salary"
					bind:value={starting_salary}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="100000"
					required
				/>
			</div>
			<div>
				<label for="starting-age" class="my-2 block text-sm font-medium text-gray-900"
					>Starting Age</label
				>
				<input
					type="number"
					id="starting-age"
					bind:value={starting_age}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="22"
					required
				/>
			</div>
			<div>
				<label for="retire-age" class="my-2 block text-sm font-medium text-gray-900"
					>Retirement Age</label
				>
				<input
					type="number"
					id="retire-age"
					bind:value={retire_age}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="50"
					required
				/>
			</div>
		</div>

		<div class="flex items-end gap-3">
			<div>
				<label for="yrs-retired" class="my-2 block text-sm font-medium text-gray-900"
					>Years Retired</label
				>
				<input
					type="number"
					id="yrs-retired"
					bind:value={yrs_retired}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="40"
					required
				/>
			</div>
			<div>
				<label for="salary-yoy-incr" class="my-2 block text-sm font-medium text-gray-900"
					>YoY Salary Increase (%)</label
				>
				<input
					type="number"
					id="salary-yoy-incr"
					bind:value={salary_yoy_incr}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="3"
					required
				/>
			</div>
			<div>
				<label for="stock-market-return" class="my-2 block text-sm font-medium text-gray-900"
					>Stock Market Return (%)</label
				>
				<input
					type="number"
					id="stock-market-return"
					bind:value={stock_market_return}
					class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
					defaultValue="7"
					required
				/>
			</div>
		</div>
		<div class="salary-adjustments"></div>
		<button
			type="button"
			class="my-2 rounded-lg text-sm"
			onclick={() => {
				if (salary_adjustments >= 5) return;
				addSalaryAdjustment();
			}}
		>
			+ Salary Adjustment
		</button>
		<label for="monthly-expense" class="my-2 block text-sm font-medium text-gray-900"
			>Monthly Expenses (rent, grocery, etc)</label
		>
		<input
			type="number"
			id="monthly-expense"
			bind:value={monthly_expense}
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
			defaultValue="4500"
			required
		/>
		<label for="contrib-401" class="my-2 block text-sm font-medium text-gray-900"
			>Annual 401(k) contribution</label
		>
		<input
			type="number"
			id="contrib-401"
			bind:value={contrib_401}
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
			defaultValue="30750"
			required
		/>
		<label for="withdraw-expense-pct" class="my-2 block text-sm font-medium text-gray-900"
			>Retirement Percentage Expenses</label
		>
		<input
			type="number"
			id="withdraw-expense-pct"
			bind:value={retirement_pct}
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
			required
		/>
		<input
			type="checkbox"
			id="inflation-adjustment"
			bind:checked={inflation_adjustment}
			class="my-4"
		/>
		<label for="inflation-adjustment" class="text-sm font-medium text-gray-900"
			>Adjust for Inflation</label
		>
	</form>
	<div class="charts flex">
		<div class="charts-2">
			<canvas class="max-w-lg" id="salaryChart" use:salaryChartF={$state.snapshot(salaryArr)}
			></canvas>
		</div>
		<div class="charts-2">
			<canvas
				class="my-auto max-w-lg"
				id="brokerageChart"
				use:brokerageChartF={[
					$state.snapshot(brokerageValueArrTrad),
					$state.snapshot(totalWithdrawalTrad)
				]}
			></canvas>
		</div>
	</div>
</div>

<style>
	.charts-2 {
		height: 50vh;
		width: 50vw;
	}
</style>
