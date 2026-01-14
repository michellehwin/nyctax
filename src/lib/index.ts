// place files you want to import through the `$lib` alias in this folder.

const limit_401k = 23000
const roth_ira_limit = 7000
const fica_limit = 168600
const over_200_rate = .009 // earn over 200k pay extra 0.9% medicare
const ny_std_deduction = 8000
const fed_std_deduction = 14600

function brokerage_bal_f(init: number, monthly_dep: number, rate: number, years: number, monthly_dep_end = true, verbose = false) {
    // calculate brokerage balance, assume deposit at the end of each month
    let bal = monthly_dep_end ? init + monthly_dep : init;
    const periods = years * 12 - (monthly_dep_end ? 1 : 0);
    for (let i = 1; i <= periods; i++) {
        if (verbose)
            console.log(`${i} interest: ${bal * (rate / 12)}`)
        bal = bal * (1 + rate / 12) + monthly_dep
    }
    return bal
}

function nys_tax(salary: number) {
    //new york state tax
    let taxable_income = salary - ny_std_deduction
    if (taxable_income <= 0)
        return 0
    else if (taxable_income <= 8500)
        return taxable_income * 0.04
    else if (taxable_income <= 11700)
        return 12000 * 0.04 + (taxable_income - 12000) * 0.045
    else if (taxable_income <= 13900)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (taxable_income - 11700) * 0.0525
    else if (taxable_income <= 80650)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (taxable_income - 13900) * 0.055
    else if (taxable_income <= 215400)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (80650 - 13900) * 0.055 + (taxable_income - 80650) * 0.06
    else if (taxable_income <= 1077550)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (80650 - 13900) * 0.055 + (215400 - 80650) * 0.06 + (taxable_income - 215400) * 0.0685
    else if (taxable_income <= 5000000)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (80650 - 13900) * 0.055 + (215400 - 80650) * 0.06 + (1077550 - 215400) * 0.0685 + (taxable_income - 1077550) * 0.0965
    else if (taxable_income <= 25000000)
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (80650 - 13900) * 0.055 + (215400 - 80650) * 0.06 + (1077550 - 215400) * 0.0685 + (5000000 - 1077550) * 0.0965 + (taxable_income - 5000000) * 0.103
    else
        return 12000 * 0.04 + (11700 - 8500) * 0.045 + (13900 - 11700) * 0.0525 + (80650 - 13900) * 0.055 + (215400 - 80650) * 0.06 + (1077550 - 215400) * 0.0685 + (5000000 - 1077550) * 0.0965 + (25000000 - 5000000) * 0.103 + (taxable_income - 25000000) * 0.109
}
function nyc_tax(salary: number) {
    // new york city tax
    let taxable_income = salary - ny_std_deduction
    if (taxable_income <= 0)
        return 0
    else if (taxable_income <= 12000)
        return taxable_income * 0.03078
    else if (taxable_income <= 25000)
        return 12000 * 0.03078 + (taxable_income - 12000) * 0.03762
    else if (taxable_income <= 50000)
        return 12000 * 0.03078 + (25000 - 12000) * 0.03762 + (taxable_income - 25000) * 0.03819
    else
        return 12000 * 0.03078 + (25000 - 12000) * 0.03762 + (50000 - 25000) * 0.03819 + (taxable_income - 50000) * 0.03876
}
function federal_tax(salary: number) {
    let taxable_inc = salary - fed_std_deduction
    if (taxable_inc <= 0)
        return 0
    else if (taxable_inc <= 11600)
        return taxable_inc * 0.1
    else if (taxable_inc <= 47150)
        return 11600 * 0.1 + (taxable_inc - 11600) * 0.12
    else if (taxable_inc <= 100525)
        return 11600 * 0.1 + (47150 - 11600) * 0.12 + (taxable_inc - 47150) * 0.22
    else if (taxable_inc <= 191950)
        return 11600 * 0.1 + (47150 - 11600) * 0.12 + (100525 - 47150) * 0.22 + (taxable_inc - 100525) * 0.24
    else if (taxable_inc <= 243725)
        return 11600 * 0.1 + (47150 - 11600) * 0.12 + (100525 - 47150) * 0.22 + (191950 - 100525) * 0.24 + (taxable_inc - 191950) * 0.32
    else if (taxable_inc <= 609350)
        return 11600 * 0.1 + (47150 - 11600) * 0.12 + (100525 - 47150) * 0.22 + (191950 - 100525) * 0.24 + (243725 - 191950) * 0.32 + (taxable_inc - 243725) * 0.35
    else
        return 11600 * 0.1 + (47150 - 11600) * 0.12 + (100525 - 47150) * 0.22 + (191950 - 100525) * 0.24 + (243725 - 191950) * 0.32 + (609350 - 243725) * 0.35 + (taxable_inc - 609350) * 0.37
}

function fica(salary: number) {
    if (salary > 200000)
        return fica_limit * 0.0765 + (salary - 200000) * over_200_rate
    else if (salary > fica_limit)
        return fica_limit * 0.0765
    else
        return salary * 0.0765
}

function total_nyc_tax(salary: number) { return nys_tax(salary) + nyc_tax(salary) + federal_tax(salary) }

function total_nyc_tax_fica(salary: number) { return total_nyc_tax(salary) + fica(salary) }

export { brokerage_bal_f, nys_tax, nyc_tax, federal_tax, fica, total_nyc_tax, total_nyc_tax_fica }