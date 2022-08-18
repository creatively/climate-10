import React, { useEffect, useState } from 'react';
import { useEffectOnce } from './others-hooks/useEffectOnce'
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryAxis, VictoryLabel, VictoryLine } from 'victory'
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
  const finishDateMMDD: string = `12-31`
  const numberOfDaysToGet: number = 365  // ^
  const numberOfYearsToGet: number = 3
  const runningAverageSpread: number = 20
  const address: string = `london`


  function getRunningAverages(arrayOfNumbers: any, spreadSize: number) {
    let arrayRunningAveragedItems: number[] = []

    // initial items before spreadSize is reached
    for (let itemIndex: number=0; itemIndex < spreadSize; itemIndex++) { 
      let cumulativeTotalOfCurrentNumber: number = 0
      for (let positionIndex: number=0; positionIndex < itemIndex; positionIndex++) {
          cumulativeTotalOfCurrentNumber += arrayOfNumbers[positionIndex]
      }
      const runningAveragedItem: number = Math.round(cumulativeTotalOfCurrentNumber / itemIndex)
      arrayRunningAveragedItems.push(runningAveragedItem)
    }

    // items where there are now more items than spreadSize
    for (let itemIndex: number = spreadSize - 1; itemIndex < arrayOfNumbers.length; itemIndex++) { 
      let cumulativeTotalOfCurrentNumber: number = 0
      for (let positionIndex: number = 0; positionIndex < spreadSize; positionIndex++) {
          const indexOfItemToAdd: number = itemIndex - positionIndex
          cumulativeTotalOfCurrentNumber += arrayOfNumbers[indexOfItemToAdd]
      }
      const runningAveragedItem: number = Math.round(cumulativeTotalOfCurrentNumber / spreadSize)
      arrayRunningAveragedItems.push(runningAveragedItem)
    }

    // return the running averages array
    return arrayRunningAveragedItems.filter(item => item === Number(item))
  }


  // when year changes
  useEffect(() => {
    if (years.length > 0) {
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 3)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 3)

      // calculate & set temperature average by day of previous years
      function average(array: number[]) {
        const total = array.reduce((prev, cur) => {
          return prev + cur;
        })
        return Math.round(total / array.length)
      }

      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let yearsIndex=0; yearsIndex<numberOfDaysToGet; yearsIndex++) {
          if (years[yearsIndex] && years[yearsIndex].temperatures[daysIndex]) {
            arrayDay.push(years[yearsIndex].temperatures[daysIndex])
          }
        }
        arrayAverages.push(average(arrayDay))
      }
      const arrayRunningAveraged: number[] = getRunningAverages(arrayAverages, runningAverageSpread)
      setAveragesAcrossYears(arrayRunningAveraged)
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

        <VictoryAxis 
          domain={[0, numberOfDaysToGet]}
          label={`Day`}
        />
        <VictoryAxis dependentAxis 
          domain={[axisYmin, axisYmax]}
          label={`Daily maximum temperatures`}
          axisLabelComponent={<VictoryLabel dy={-10} />}
          style={{
            grid: {stroke: "#eee"},
          }}
        />

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
              stroke: "#444",
              strokeWidth: 4
            }
          }}
        />

      </VictoryChart>
        
    </div>
  )
}

