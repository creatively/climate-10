export interface Year {
    year: number,
    temperatures: number[]
}

export interface Years {
    years: Year[]
}

export interface YearsState {
    years: Year[],
    addYear: (year: number, temperatures: number[]) => void
}
