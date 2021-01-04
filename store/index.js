export const state = () => ({
    year: localStorage['data-year'],
    sem: localStorage['data-sem'],
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
}
