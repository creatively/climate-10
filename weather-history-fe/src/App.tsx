import React, { useEffect, useState } from 'react';
import { useEffectOnce } from './others-hooks/useEffectOnce'
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryAxis, VictoryBar, VictoryTooltip, VictoryLabel, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import APICalls from './APICalls'
import './App.css';


export default function App() {

  const { years, addYear } = useStore()
  const { oldYears, addOldYear } = useStore()
  const [ axisYmin, setAxisYmin ] = useState<number>(0)
  const [ axisYmax, setAxisYmax ] = useState<number>(0)
  const [ averagesAcrossYears, setAveragesAcrossYears ] = useState<number[]>([])
  const [ oldAveragesAcrossYears, setOldAveragesAcrossYears ] = useState<number[]>([])


  const weatherParameter: string = `tempmax`
  const yearsAgoStart: number = 0
  const oldYearsAgoStart: number = 10
  const startDateMMDD: string = `01-01`
  const finishDateMMDD: string = `12-31`
  const numberOfDaysToGet: number = 365  // ^
  const numberOfYearsToGet: number = 5
  const runningAverageSpread: number = 15
  const address: string = `nicosia`


  // utility function - averages numbers
  function average(array: number[]) {
    const total = array.reduce((prev, cur) => {
      return prev + cur;
    })
    return Math.round(total / array.length)
  }

  // utility function - running-average array from an array of numbers
  function getRunningAverages(arrayOfNumbers: any, spreadSize: number) {
    let arrayRunningAveragedItems: number[] = []

    // average-out initial items in the array before spreadSize is reached
    for (let itemIndex: number=0; itemIndex < spreadSize; itemIndex++) { 
      let cumulativeTotalOfCurrentNumber: number = 0
      for (let positionIndex: number=0; positionIndex < itemIndex; positionIndex++) {
          cumulativeTotalOfCurrentNumber += arrayOfNumbers[positionIndex]
      }
      const runningAveragedItem: number = Math.round(cumulativeTotalOfCurrentNumber / itemIndex)
      arrayRunningAveragedItems.push(runningAveragedItem)
    }

    // average-out all other items
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

      // when 'year' changes, obtain the latest min/max values to size the graph axis
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 3)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 3)

      // calculate & set the running-average temperature for x days over x years
      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let yearsIndex=0; yearsIndex<numberOfDaysToGet; yearsIndex++) {
          if (years[yearsIndex] && years[yearsIndex]?.temperatures[daysIndex]) {
            arrayDay.push(years[yearsIndex]?.temperatures[daysIndex])
          }
        }
        if (arrayDay?.length > 0) {
          arrayAverages.push(average(arrayDay))
        }
      }
      const arrayRunningAveraged: number[] = getRunningAverages(arrayAverages, runningAverageSpread)
      setAveragesAcrossYears(arrayRunningAveraged)
    }

  }, [ years ])


  // when oldYears changes
  useEffect(() => {

    if (oldYears.length > 0) {

      // calculate & set the running-average temperature for x days over x years
      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let oldYearsIndex=0; oldYearsIndex<numberOfDaysToGet; oldYearsIndex++) {
          if (oldYears[oldYearsIndex] && oldYears[oldYearsIndex]?.temperatures[daysIndex]) {
            arrayDay.push(oldYears[oldYearsIndex]?.temperatures[daysIndex])
          }
        }
        if (arrayDay?.length > 0) {
          arrayAverages.push(average(arrayDay))
        }
      }
      const arrayRunningAveraged: number[] = getRunningAverages(arrayAverages, runningAverageSpread)
      setOldAveragesAcrossYears(arrayRunningAveraged)
    }

  }, [ oldYears ])


  // call BE api for data on first render
  useEffectOnce(() => {
    APICalls(address, yearsAgoStart, oldYearsAgoStart, numberOfYearsToGet, startDateMMDD, finishDateMMDD, addYear, addOldYear, weatherParameter)
  })


  return (

    <div className="App">

      <VictoryChart>

        <VictoryAxis
          domain={[0,365]} 
          label={`Month`}
          axisLabelComponent={<VictoryLabel dy={5} />}
          tickValues={[15, 46, 74, 105, 135, 167, 197, 227, 257, 288, 319, 349]}
          tickFormat={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
        />
        <VictoryAxis dependentAxis
          label={`Daily maximum temperatures`}
          tickFormat={[-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45]}
          domain={[axisYmin,axisYmax]}
          axisLabelComponent={<VictoryLabel dy={-11} />}
          style={{
            grid: {
              stroke: "#bbb",
              strokeWidth: 1
            }
          }}
        />

        {years.map((year: Year, index: number) => (
            <VictoryLine
              key={`key_year_${index}`}
              interpolation="natural"
              data={year.temperatures}
              label={year.year.toString()}
              style={{
                data: {
                  stroke: "#eee",
                  strokeWidth: 1
                }
              }}
            />
        ))}



        {oldYears.map((oldYear: Year, index: number) => (

            <VictoryLine
              key={`key_oldyear_${index}`}
              interpolation="natural"
              data={oldYear.temperatures}
              label={oldYear.year.toString()}
              style={{
                data: {
                  stroke: "#eee",
                  strokeWidth: 1
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
              stroke: "red",
              strokeWidth: 1
            }
          }}
        />

        <VictoryLine
          key={`key_old_averages`}
          interpolation="natural"
          data={oldAveragesAcrossYears}
          style={{
            data: {
              stroke: "blue",
              strokeWidth: 1
            }
          }}
        />

      </VictoryChart>
        
    </div>
  )
}

