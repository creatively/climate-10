import React, { useEffect, useState } from 'react';
import { useEffectOnce } from './others-hooks/useEffectOnce'
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import APICalls from './APICalls'
import './App.css';


export default function App() {

  const { years, addYear } = useStore()
  //const { oldYears, addOldYear } = useStore()
  const [ axisYmin, setAxisYmin ] = useState<number>(0)
  const [ axisYmax, setAxisYmax ] = useState<number>(0)
  const [ averagesAcrossYears, setAveragesAcrossYears ] = useState<number[]>([])

  const startDateMMDD: string = `01-01`
  const finishDateMMDD: string = `01-08`
  const numberOfDaysToGet: number = 8  // ^
  const numberOfYearsToGet: number = 3
  const address: string = `london`


  // when year changes
  useEffect(() => {
    if (years.length > 0) {
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 1)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 1)

      // calculate & set temperature average by day of previous years
      function average(array: number[]) {
        const total = array.reduce((prev, cur) => {
          return prev + cur;
        })
        return Math.round(total / array.length)
      }

      let arrayAverages: number[] = []
      for (let daysIndex=0; daysIndex<numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let yearsIndex=0; yearsIndex<numberOfDaysToGet; yearsIndex++) {
          if (years[yearsIndex] && years[yearsIndex].temperatures[daysIndex]) {
            arrayDay.push(years[yearsIndex].temperatures[daysIndex])
          }
        }
        arrayAverages.push(average(arrayDay))
      }
      setAveragesAcrossYears(arrayAverages)
    }

  }, [ years ])

  // on first render
  useEffectOnce(() => {
    APICalls(address, numberOfYearsToGet, startDateMMDD, finishDateMMDD, addYear)
  })


  return (

    <div className="App">
      
      <VictoryChart
        maxDomain={{ y: axisYmax }}
        minDomain={{ y: axisYmin }}
        width={1200}
      >
        {years.map((year: Year, index: number) => (
            <VictoryLine
              key={`key${index}`}
              interpolation="natural"
              data={year.temperatures}
              style={{
                data: {
                  stroke: "#ccc"
                }
              }}
            />
        ))}

        <VictoryLine
          key={`key_averages`}
          interpolation="natural"
          data={averagesAcrossYears}
          style={{
            data: {
              stroke: "#444"
            }
          }}
        />

      </VictoryChart>
        
    </div>
  )
}

