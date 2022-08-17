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


  // get min & max for graph axis Y
  useEffect(() => {
    if (years.length > 0) {
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 1)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 1)

      function sum(arr: number[]) {
        return arr.reduce((a: number, b: number) => a + b, 0)
      }

      function getTotalsOfAPropertyInArrayOfObjects(arrayOfObjects: any, propertyName: string) {
        const totals = arrayOfObjects.reduce((accumulator: any, object: any) => {
          const sumOfAllTemperaturesOnThatDayOfTheYear = sum(object[propertyName])
          return accumulator + sumOfAllTemperaturesOnThatDayOfTheYear
        }, 0)
        return totals
      }

      let arrayDayTemperatureTotals: number[] = getTotalsOfAPropertyInArrayOfObjects(years, `temperatures`)
      //let arrayDayTemperatureAverages: number[] = []
      



      console.log(`arrayDayTemperatureTotals = `, arrayDayTemperatureTotals)
      // for (arrayDayTemperatureTotals) 
      // arrayDayTemperatureAverages[index]


      //setAveragesAcrossYears(arrayDayTemperatureAverages)

    }

      /*
      years.forEach((year: Year) => {
        year.temperatures.forEach((day: number, dayIndex: number) => {
          const newTotal = Number(TOTALS_ARRAY[dayIndex]) + Number(day)
          TOTALS_ARRAY[dayIndex] = newTotal
        })
      })
console.log(`const  = ....`)
console.log(TOTALS_ARRAY)

      const arrayOfAverageTemps: number[] = []
      TOTALS_ARRAY.forEach((dayValue: number) => {
        arrayOfAverageTemps.push(Math.ceil(dayValue / years.length))
      })

      setAveragesAcrossYears(arrayOfAverageTemps)
      */

  }, [ years ])

  useEffectOnce(() => {
    //            no. of years ,  [ start-fin MM-DDs ]
    APICalls(address, numberOfYearsToGet, startDateMMDD, finishDateMMDD, addYear)
  })

console.log(averagesAcrossYears)
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
                  stroke: "#A52A2A"
                }
              }}
            />
        ))}
    
        <VictoryLine
          key={`key_averages`}
          interpolation="natural"
          data={[20, 22, 23, 22, 22, 25, 24, 20]}
          style={{
            data: {
              stroke: "#fc0fc0"
            }
          }}
        />

      </VictoryChart>
        
    </div>
  )
}

