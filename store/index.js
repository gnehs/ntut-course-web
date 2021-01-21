export const state = () => ({
    year: localStorage['data-year'],
    sem: localStorage['data-sem'],
    department: localStorage['data-department'],
})

export const mutations = {
    updateYear(state, year) {
        localStorage['data-year'] = year
        state.year = year
    },
    updateSem(state, sem) {
        localStorage['data-sem'] = sem
        state.sem = sem
    },
    updateDepartment(state, d) {
        localStorage['data-department'] = d
        state.department = d
    },
}
