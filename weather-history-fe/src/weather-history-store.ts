import create from 'zustand'
import { Year, Years, YearsState } from './interfaces'


export const useStore = create<YearsState>((set) => ({

    years: [],
    oldYears: [],

    addYear: (year: number, temperatures: number[]): void => {
      set((state) => ({
        years: [
          ...state.years,
          {
            year: year,
            temperatures: temperatures,
          } 
        ]
      }))
    },

    addOldYear: (year: number, temperatures: number[]): void => {
        set((state) => ({
          years: [
            ...state.years,
            {
              year: year,
              temperatures: temperatures,
            } 
          ]
        }))
    }
}))