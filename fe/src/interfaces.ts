export interface Year {
    year: number,
    temperatures: number[]
}

export interface Years {
    years: Year[]
}

export interface YearsState {
    years: Year[],
    oldYears: Year[],
    addYear: (year: number, temperatures: number[]) => void,
    addOldYear: (year: number, temperatures: number[]) => void,
    clearYears: () => void,
    clearOldYears: () => void
}

export interface BiggestMonthIncrease {
    month: string,
    increaseAmount: number
}
